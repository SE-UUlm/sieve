from ai_backend.provider import Provider
from ai_backend.utils import format_email, category_to_flow, category_to_schema
from ai_backend.product_flow import product_flow
from langchain_core.callbacks import UsageMetadataCallbackHandler
import asyncpg
from langchain.tools import ToolRuntime
import pprint
from langchain.messages import HumanMessage, SystemMessage
from langgraph.types import Send
from langchain.chat_models import init_chat_model
from dotenv import load_dotenv
from ai_backend.schemas import (
    ResponseFormatData,
    Context,
    RouterState,
    CategorizationResult,
    SubGraphState,
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


async def simple_flow(state: SubGraphState, runtime: ToolRuntime[Context]) -> dict:
    print("simple flow", state.category)
    schema = category_to_schema(state.category)
    structured = runtime.context.simple_model.with_structured_output(schema)
    result = await structured.ainvoke(
        [
            SystemMessage(
                f"""Your job is to convert a customer's email into a structured form. Only use the content of the email that relates to the category {state.category} and ignore other parts.
                Respond in English. Be as concise as possible."""
            ),
            HumanMessage(format_email(state.email)),
        ]
    )

    flow_result = FlowResult(
        category=state.category,
        structured_output=result,
        steps={},
    )

    return {"results": [flow_result]}


def route_to_flow(state: RouterState) -> list[Send]:
    """Fan out to agents based on classifications."""

    # TODO auf Duplikate testen
    return [
        Send(
            category_to_flow(category),
            SubGraphState(email=state.email, category=category),
        )
        for category in state.categories
    ]


async def categorize(state: RouterState, runtime: ToolRuntime[Context]) -> dict:
    structured = runtime.context.simple_model.with_structured_output(
        CategorizationResult
    )

    result = await structured.ainvoke(
        [
            SystemMessage(
                """Your job is to categorize an email from a customer into the possible categories. 
                If the customer has multiple requests that fit different categories, list multiple differnt categories. 
                Do not list duplicate categories."""
            ),
            HumanMessage(format_email(state.email)),
        ]
    )
    pprint.pprint(result)
    return {"categories": result.categories}


def init_simple_model(provider: Provider, api_key: str):
    if provider == "GOOGLE_VERTEX_AI":
        return init_chat_model(
            model="gemini-2.5-flash",
            temperature=0.1,
            timeout=10,
            max_tokens=10000,
            api_key=api_key,
        )

    elif provider == "ANTHROPIC":
        return init_chat_model(
            model="claude-haiku-4-5-20251001",
            temperature=0.1,
            timeout=10,
            max_tokens=10000,
            api_key=api_key,
        )

    elif provider == "OPENAI":
        return init_chat_model(
            model="gpt-4o-mini",
            temperature=0.1,
            timeout=10,
            max_tokens=10000,
            api_key=api_key,
        )

    else:
        raise ValueError(f"Unknown provider: {provider}")


def init_complex_model(provider: Provider, api_key: str):
    if provider == "GOOGLE_VERTEX_AI":
        return init_chat_model(
            model="gemini-3.1-pro-preview",
            temperature=0.1,
            timeout=10,
            max_tokens=10000,
            api_key=api_key,
        )

    elif provider == "ANTHROPIC":
        return init_chat_model(
            model="claude-sonnet-4-6",
            temperature=0.1,
            timeout=10,
            max_tokens=10000,
            api_key=api_key,
        )

    elif provider == "OPENAI":
        return init_chat_model(
            model="gpt-5.2",
            temperature=0.1,
            timeout=10,
            max_tokens=10000,
            api_key=api_key,
        )

    else:
        raise ValueError(f"Unknown provider: {provider}")


# TODO: input schema und output schema
workflow = (
    StateGraph(RouterState)
    .add_node("categorize", categorize)
    .add_node("simple", simple_flow)
    .add_node("product", product_flow)
    .add_edge(START, "categorize")
    .add_conditional_edges("categorize", route_to_flow, ["simple", "product"])
    .add_edge("simple", END)
    .add_edge("product", END)
    .compile()
)


async def run_analyze_email_agent(
    provider: Provider,
    api_key: str,
    subject: str | None,
    body: str,
    db_pool: asyncpg.Pool,
) -> ResponseFormatData:
    cb = UsageMetadataCallbackHandler()

    simple_model = init_simple_model(provider, api_key)
    complex_model = init_complex_model(provider, api_key)

    db_schema = await get_database_schema(db_pool)
    print(f"🗂️ db_schema: {db_schema}")

    context = Context(
        db_pool=db_pool,
        db_schema=db_schema,
        simple_model=simple_model,
        complex_model=complex_model,
    )
    config = {"callbacks": [cb]}

    result = await workflow.ainvoke(
        {
            "email": {"subject": subject, "body": body},
        },
        config=config,
        context=context,
    )

    pprint.pprint(result)

    print(f"Usage metadata: {cb.usage_metadata}")

    return result["results"]
