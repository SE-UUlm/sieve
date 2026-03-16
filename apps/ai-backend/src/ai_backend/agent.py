import asyncpg
from langchain.tools import tool, ToolRuntime
import pprint
from langchain.agents import create_agent
from langchain.messages import HumanMessage, SystemMessage
from langchain.chat_models import init_chat_model
from dotenv import load_dotenv
from ai_backend.schemas import ResponseFormat, ResponseFormatData, SearchResult, Context

load_dotenv()


@tool
async def search_product(
    table_name: str,
    search_columns: list[str],
    return_columns: list[str],
    query: list[str],
    runtime: ToolRuntime[Context],
):
    """Useful to search for product information. Use multiple keywords for query. If one keyword is contained in any specified column value, the item is returned.
    Database hints: The database only contains lego sets. The metadata column contains the part count. The products in the database are named in german"""

    db_schema = runtime.context.db_schema
    if table_name not in db_schema:
        raise ValueError(f"Table {table_name} not found in database schema")

    if not all(col in db_schema[table_name] for col in search_columns):
        raise ValueError(f"Columns {search_columns} not found in table {table_name}")

    if not all(col in db_schema[table_name] for col in return_columns):
        raise ValueError(f"Columns {return_columns} not found in table {table_name}")

    async with runtime.context.db_pool.acquire() as conn:
        search_patterns = [f"%{word}%" for word in query]

        select_columns = ", ".join([f'"{col}"' for col in return_columns])

        # Cast values to text to make sure they work with ILIKE
        column_conditions = [f'"{col}"::text ILIKE ANY($1)' for col in search_columns]
        where_clause = " OR ".join(column_conditions)

        sqlQuery = f"SELECT {select_columns} FROM {table_name} WHERE {where_clause};"

        rows = await conn.fetch(sqlQuery, search_patterns)
        rows_dicts = [dict(row) for row in rows]
        print(
            f"🛠️ search_product: {table_name}, {search_columns}, {return_columns}, {query} -> {rows_dicts}"
        )
        return rows_dicts


def _build_model(api_key: str):
    return init_chat_model(
        model="gpt-5.2",
        temperature=0.1,
        timeout=10,
        max_tokens=10000,
        api_key=api_key,
    )


def _build_response_agent(model):
    system_prompt = """Your job is to categorize a given email from a customer or potential customer and convert it into a structured form.
    If none of the categories match, classify the email as 'Other'.
    Write answers in the third person about the customer. Be as concise as possible.
    Answer Language: English"""
    return create_agent(
        model=model,
        system_prompt=system_prompt,
        response_format=ResponseFormat,
    )


def _build_search_agent(model):
    system_prompt = """Your job is to find the product(s) the customer wants to buy or is talking about in their email.
    Use the search_product tool to find the products, use the provided database schema (tables and their columns). Try multiple times with different keywords, variants, translations until you think you found the products the customer wants.
    If you think you found the right products return them using the provided output format. Together with your confidence score.
    Answer Language: English"""
    return create_agent(
        model=model,
        system_prompt=system_prompt,
        response_format=SearchResult,
        tools=[search_product],
        context_schema=Context,
    )


def _build_email_for_analysis(subject: str | None, body: str) -> str:
    if subject is None or subject.strip() == "":
        return f"Email body:\n{body}"

    return f"Email subject:\n{subject}\n\nEmail body:\n{body}"


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


async def run_analyze_email_agent(
    api_key: str, subject: str | None, body: str, db_pool: asyncpg.Pool
) -> ResponseFormatData:
    formatted_email = _build_email_for_analysis(subject=subject, body=body)

    db_schema = await get_database_schema(db_pool)
    print(f"🗂️ db_schema: {db_schema}")

    model = _build_model(api_key)

    search_agent = _build_search_agent(model)
    conversation = [
        SystemMessage(f"""Database Schema: {db_schema}"""),
        HumanMessage(formatted_email),
    ]

    result = await search_agent.ainvoke(
        {"messages": conversation},
        context=Context(db_pool=db_pool, db_schema=db_schema),
    )
    pprint.pp(result)

    print("🔎 search agent result:\n" + result["structured_response"].model_dump_json())

    response_agent = _build_response_agent(model)
    conversation = [
        SystemMessage(
            "Related products: \n" + result["structured_response"].model_dump_json()
        ),
        HumanMessage(formatted_email),
    ]
    result = await response_agent.ainvoke({"messages": conversation})
    pprint.pp(result)
    return result["structured_response"].data
