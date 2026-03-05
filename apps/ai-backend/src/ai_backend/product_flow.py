import json
from ai_backend.agent import category_to_schema
import pprint
from ai_backend.utils import format_email
from langchain.messages import SystemMessage, HumanMessage
from langchain.agents import create_agent
from ai_backend.schemas import Context, SubGraphState, SearchResult, FlowResult
from langchain.tools import tool, ToolRuntime
from langgraph.graph import StateGraph, START, END


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


async def find_related_products(
    state: SubGraphState, runtime: ToolRuntime[Context]
) -> dict:
    system_prompt = """Your job is to find the product(s) the customer wants to buy or is talking about in their email. 
        Use the search_product tool to find the products the customer might want, use the provided database schema (tables and their columns). Try multiple different keywords, variants, translations and try again if you are not satisfied with the results. 
        If you think you found the right products return them using the provided output format. Together with your confidence score.
        Answer Language: English"""
    agent = create_agent(
        model=runtime.context.simple_model,
        system_prompt=system_prompt,
        response_format=SearchResult,
        tools=[search_product],
        context_schema=Context,
    )
    conversation = [
        SystemMessage(f"""Database Schema: {runtime.context.db_schema}"""),
        HumanMessage(format_email(state.email)),
    ]
    result = await agent.ainvoke(
        {"messages": conversation},
    )

    for msg in result["messages"]:
        msg.pretty_print()

    return {"related_products": result["structured_response"].potentialProducts}


async def generate_structured_response(
    state: SubGraphState, runtime: ToolRuntime[Context]
) -> FlowResult:
    pprint.pprint(state)
    schema = category_to_schema(state.category)
    print(schema)
    structured = runtime.context.simple_model.with_structured_output(
        schema.model_json_schema()
    )
    result = await structured.ainvoke(
        [
            SystemMessage("""Your job is to categorize a given email from a customer or potential customer and convert it into a structured form.
    If none of the categories match, classify the email as 'Other'.
    Write answers in the third person about the customer. Be as concise as possible.
    Answer Language: English"""),
            SystemMessage(
                "Related products: \n"
                + json.dumps(
                    [product.model_dump() for product in state.related_products]
                )
            ),
            HumanMessage(format_email(state.email)),
        ]
    )
    return FlowResult(
        category=state.category,
        structured_output=result,
        steps={
            "find_related_products": {"related_products": state.related_products},
            "summary": state.steps["summary"],
        },
    )


async def summary(state: SubGraphState, runtime: ToolRuntime[Context]) -> dict:
    result = await runtime.context.simple_model.ainvoke(
        [
            SystemMessage(f"""Your job is to summarize a customer's email regarding the category '{state.category}'.
            Be as concise as possible.
            Answer Language: English"""),
            HumanMessage(format_email(state.email)),
        ]
    )

    pprint.pprint(result)

    return {"steps": {"summary": result.content}}


product_subgraph = (
    StateGraph(SubGraphState, output_schema=FlowResult)
    .add_node("find_related_products", find_related_products)
    .add_node("generate_structured_response", generate_structured_response)
    .add_node("summary", summary)
    .add_edge(START, "find_related_products")
    .add_edge("find_related_products", "summary")
    .add_edge("summary", "generate_structured_response")
    .add_edge("generate_structured_response", END)
    .compile()
)


async def product_flow(state: SubGraphState, runtime: ToolRuntime[Context]) -> dict:
    """Search for products"""
    print("product flow", state.category)
    pprint.pprint(state)
    response = await product_subgraph.ainvoke(state)
    pprint.pprint(response)
    return {"results": [response]}
