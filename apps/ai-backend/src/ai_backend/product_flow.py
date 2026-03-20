from typing import Annotated
from ai_backend.shared_flow import summary, structured_response
from ai_backend.utils import format_email
from langchain.messages import SystemMessage, HumanMessage
from langchain.agents import create_agent, AgentState
from ai_backend.schemas import (
    Context,
    FlowGraphState,
    FlowResult,
    SearchResult,
    ProductFlowSteps,
)
from langchain.tools import tool, ToolRuntime, InjectedState, ToolException
from langgraph.graph import StateGraph, START, END


@tool
async def search_product(
    table_name: str,
    search_columns: list[str],
    return_columns: list[str],
    query: list[str],
    state: Annotated[AgentState, InjectedState],
    runtime: ToolRuntime[Context],
):
    """Useful to search for product information. Use multiple keywords for query.
    If of the query items is contained in any specified column value, the item is returned.
    Try to use short query items, ideally only one word per item. But multiple items."""

    tool_calls = len([m for m in state["messages"] if m.type == "tool"])

    if tool_calls >= 5:
        return "search_product Tool call limit exceeded. Now return the result with the potentialProducts and your confidence score."

    if tool_calls >= 10:
        raise ToolException("Max tries (10) for this tool reached.")

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
            f"🛠️ search_product ({tool_calls}): {table_name}, {search_columns}, {return_columns}, {query} -> {rows_dicts}"
        )
        return rows_dicts


async def db_step(state: FlowGraphState, runtime: ToolRuntime[Context]) -> dict:
    """Tries to find products from the database that are the ones the customer is talking about"""

    agent = create_agent(
        model=runtime.context.complex_model,
        response_format=SearchResult,
        tools=[search_product],
        context_schema=Context,
    )
    conversation = [
        SystemMessage("""Your job is to find the product(s) the customer wants to buy or is talking about in their email. 
        Use the search_product tool to find the products the customer might want, use the provided database schema (tables and their columns). 
        Try multiple different keywords, variants, translation and try again a maximum of 5 times until you're satisfied with the results.
        If you think you found the right products return them using the provided output format. Together with your confidence score.
        Answer Language: English"""),
        SystemMessage(f"""Database Schema: {runtime.context.db_schema}"""),
        HumanMessage(format_email(runtime.context.email)),
    ]
    result = await agent.ainvoke(
        {"messages": conversation},
    )

    # TODO: Sometimes it doesnt finish. Especially with 4o-mini and if it does not find the right products. Maybe try to debug with streaming. Maybe now its fixed?

    for msg in result["messages"]:
        msg.pretty_print()

    return {"steps": {"db_step": result["structured_response"].potentialProducts}}


product_subgraph = (
    StateGraph(FlowGraphState, output_schema=FlowResult[ProductFlowSteps])
    .add_node("db_step", db_step)
    .add_node("structured_response", structured_response)
    .add_node("summary", summary)
    .add_edge(START, "db_step")
    .add_edge(START, "summary")
    .add_edge("db_step", "structured_response")
    .add_edge(["structured_response", "summary"], END)
    .compile()
)


async def product_flow(state: FlowGraphState, runtime: ToolRuntime[Context]) -> dict:
    """Flow that additionally tries to find products in the database. Plus summary and structured response"""

    print(f"▶️ START product flow Category {state.category}")

    response: FlowResult[ProductFlowSteps] = await product_subgraph.ainvoke(state)

    print(f"✔️ END Category {state.category} Result: ", response)

    return {"results": [response]}
