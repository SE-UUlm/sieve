from langchain_core.runnables import RunnableConfig
from langgraph.runtime import Runtime
from ai_backend.simple_flow import simple_flow
from ai_backend.utils import (
    format_email,
    get_categories,
    get_provider_name,
    get_category,
)
from ai_backend.product_flow import product_flow
from langchain_core.callbacks import UsageMetadataCallbackHandler
from asyncpg import Pool
from langchain.messages import HumanMessage, SystemMessage, AIMessage
from langgraph.types import Send
from langchain.chat_models import init_chat_model
from ai_backend.schemas import (
    Context,
    GraphState,
    FlowGraphState,
    AnalyzeEmailRequest,
    ModelConfig,
    GraphOutput,
    EmailResponseSchema,
)
from langgraph.graph import StateGraph, START, END


async def get_database_schema(pool: Pool) -> dict[str, list[str]]:
    if not pool:
        return {}

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


def route_to_flows(state: GraphState, runtime: Runtime[Context]) -> list[Send]:
    """Fan out to agents based on categories."""

    categories = set(state.categories)

    if len(categories) != len(state.categories):
        print("Warning: LLM returned duplicate categories")

    return [
        Send(
            get_category(category, runtime.context.categories).flow.name,
            FlowGraphState(
                category=category,
                category_config=get_category(category, runtime.context.categories),
            ),
        )
        for category in categories
    ]


# TODO: Improve prevention that a single concern is assigned multiple categories. And that especially the Other category includes content from other categories. Maybe do a email segmentation
async def categorize(state: GraphState, runtime: Runtime[Context]) -> dict:
    context = runtime.context
    # Langchain only supports objects/dicts as structured output, not arrays directly
    json_schema = {
        "properties": {
            "categories": {
                "items": {
                    "enum": get_categories(context.categories),
                    "type": "string",
                },
                "type": "array",
            }
        },
        "required": ["categories"],
        "title": "Categorization",
        "type": "object",
    }

    structured = context.simple_model.with_structured_output(json_schema)

    result = await structured.ainvoke(
        [
            HumanMessage(format_email(context.email)),
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
                        for category in context.categories
                    ]
                )
            ),
        ]
    )

    assert isinstance(
        result, dict
    )  # Tell ty that this is a dict, not a BaseModel because we used a json schema not a pydantic model

    print(f"📁 Categories: {result['categories']}")
    return {"categories": result["categories"]}


async def overall_email_response(state: GraphState, runtime: Runtime[Context]) -> dict:
    parts = [
        flow.steps.email_response
        for flow in state.category_results
        if flow.steps.email_response
    ]

    if len(parts) == 0:
        return {"email_response": None}

    formatted_parts = "\n\n".join(part.response_body_part for part in parts)

    structured = runtime.context.simple_model.with_structured_output(
        EmailResponseSchema
    )

    conversation = [
        HumanMessage(format_email(runtime.context.email)),
        SystemMessage(
            """Your job is create a comprehensive email to the customer using the parts provided below. 
            Reformulate parts if necessary. 
            Include email salutation and closing greeting. 
            Do not include the subject in the email body."""
        ),
        AIMessage(f"Drafted email parts: {formatted_parts}"),
    ]

    custom_prompt = runtime.context.global_config.overall_email_response_prompt

    if custom_prompt:
        conversation.append(SystemMessage(custom_prompt))

    result = await structured.ainvoke(conversation)
    assert isinstance(
        result, EmailResponseSchema
    )  # Tell ty that this an EmailResponseSchema

    return {"email_response": result.result}


def init_simple_model(model_config: ModelConfig):
    return init_chat_model(
        model_provider=get_provider_name(model_config.provider),
        model=model_config.simple_model,
        temperature=0.1,
        timeout=10,
        api_key=model_config.api_key,
    )


def init_complex_model(model_config: ModelConfig):
    return init_chat_model(
        model_provider=get_provider_name(model_config.provider),
        model=model_config.complex_model,
        temperature=0.1,
        timeout=10,
        api_key=model_config.api_key,
    )


workflow = (
    StateGraph(GraphState, output_schema=GraphOutput, context_schema=Context)
    .add_node(categorize)
    .add_node("simple", simple_flow)
    .add_node("product", product_flow)
    .add_node(
        overall_email_response, defer=True
    )  # defer because this should only run after all simple and product nodes are executed
    .add_edge(START, "categorize")
    .add_conditional_edges("categorize", route_to_flows, ["simple", "product"])
    .add_edge("simple", "overall_email_response")
    .add_edge("product", "overall_email_response")
    .add_edge("overall_email_response", END)
    .compile()
)


async def run_analyze_email_agent(
    analyseRequest: AnalyzeEmailRequest,
    db_pool: Pool,
) -> GraphOutput:
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
        global_config=analyseRequest.config,
    )
    config = RunnableConfig(callbacks=[cb])

    # Result is not a pydantic object but a normal python dict
    raw_result = await workflow.ainvoke(
        GraphState(),
        config=config,
        context=context,
    )

    print("✅ Analysis done")

    print(f"💸 Usage metadata: {cb.usage_metadata}")

    result = GraphOutput(**raw_result)

    return result
