from ai_backend.simple_flow import simple_flow
from ai_backend.utils import (
    format_email,
    get_categories,
    get_category_flow,
    get_provider_name,
)
from ai_backend.product_flow import product_flow
from langchain_core.callbacks import UsageMetadataCallbackHandler
import asyncpg
from langchain.tools import ToolRuntime
from langchain.messages import HumanMessage, SystemMessage
from langgraph.types import Send
from langchain.chat_models import init_chat_model
from dotenv import load_dotenv
from ai_backend.schemas import (
    Context,
    GraphState,
    FlowGraphState,
    AnalyzeEmailRequest,
    ModelConfig,
    GraphOutput,
    FlowResult,
)
from langgraph.graph import StateGraph, START, END


load_dotenv()


async def get_database_schema(pool: asyncpg.Pool) -> dict[str, list[str]]:
    async with pool.acquire() as conn:
        tables = await conn.fetch(
            """
            SELECT table_schema, table_name
            FROM information_schema.tables
            WHERE table_type = 'BASE TABLE'
            AND table_schema NOT IN ('pg_catalog', 'information_schema');
            """
        )

        schema: dict[str, list[str]] = dict()

        for table in tables:
            table_schema = table["table_schema"]
            table_name = table["table_name"]
            columns = await conn.fetch(
                """
                SELECT column_name
                FROM information_schema.columns
                WHERE table_schema = $1
                AND table_name = $2;
                """,
                table_schema,
                table_name,
            )
            columns = [column["column_name"] for column in columns]
            schema[table_name] = columns
        return schema


def route_to_flows(state: GraphState, runtime: ToolRuntime[Context]) -> list[Send]:
    """Fan out to agents based on categories."""

    categories = set(state.categories)

    if len(categories) != len(state.categories):
        print("Warning: LLM returned duplicate categories")

    return [
        Send(
            get_category_flow(category, runtime.context.categories).name,
            FlowGraphState(category=category),
        )
        for category in categories
    ]


# TODO include custom prompts


# TODO: Improve prevention that a single concern is assigned multiple categories. And that especially the Other category includes content from other categories. Maybe do a email segmentation
async def categorize(state: GraphState, runtime: ToolRuntime[Context]) -> dict:
    # Langchain only supports objects/dicts as structured output, not arrays directly
    json_schema = {
        "properties": {
            "categories": {
                "items": {
                    "enum": get_categories(runtime.context.categories),
                    "type": "string",
                },
                "type": "array",
            }
        },
        "required": ["categories"],
        "title": "Categorization",
        "type": "object",
    }

    structured = runtime.context.simple_model.with_structured_output(json_schema)

    result = await structured.ainvoke(
        [
            SystemMessage(
                """Your job is to categorize an email from a customer into the possible categories. 
                If the customer has multiple requests that fit different categories, list multiple different categories. 
                Do not list duplicate categories."""
            ),
            SystemMessage(
                "Available categories: "
                + "\n".join(
                    [
                        f"{category.name}: {category.description}"
                        for category in runtime.context.categories
                    ]
                )
            ),
            HumanMessage(format_email(runtime.context.email)),
        ]
    )
    print(f"📁 Categories: {result['categories']}")
    return {"categories": result["categories"]}


def init_simple_model(model_config: ModelConfig):
    return init_chat_model(
        model_provider=get_provider_name(model_config.provider),
        model=model_config.simple_model,
        temperature=0.1,
        timeout=10,
        max_tokens=10000,
        api_key=model_config.api_key,
    )


def init_complex_model(model_config: ModelConfig):
    return init_chat_model(
        model_provider=get_provider_name(model_config.provider),
        model=model_config.complex_model,
        temperature=0.1,
        timeout=10,
        max_tokens=10000,
        api_key=model_config.api_key,
    )


workflow = (
    StateGraph(GraphState, output_schema=GraphOutput)
    .add_node("categorize", categorize)
    .add_node("simple", simple_flow)
    .add_node("product", product_flow)
    .add_edge(START, "categorize")
    .add_conditional_edges("categorize", route_to_flows, ["simple", "product"])
    .add_edge("simple", END)
    .add_edge("product", END)
    .compile()
)


async def run_analyze_email_agent(
    analyseRequest: AnalyzeEmailRequest,
    db_pool: asyncpg.Pool,
) -> list[FlowResult]:
    cb = UsageMetadataCallbackHandler()

    simple_model = init_simple_model(analyseRequest.model)
    complex_model = init_complex_model(analyseRequest.model)

    db_schema = await get_database_schema(db_pool)
    print(f"🗄️ db_schema: {db_schema}")

    context = Context(
        db_pool=db_pool,
        db_schema=db_schema,
        simple_model=simple_model,
        complex_model=complex_model,
        email=analyseRequest.email,
        categories=analyseRequest.categories,
    )
    config = {"callbacks": [cb]}

    result = await workflow.ainvoke(
        {},
        config=config,
        context=context,
    )

    print("✅ Analysis done")

    print(f"💸 Usage metadata: {cb.usage_metadata}")

    return result["results"]
