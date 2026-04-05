from typing import Annotated
from ai_backend.shared_flow import summary, structured_response, email_response
from ai_backend.utils import format_email
from langchain.messages import SystemMessage, HumanMessage
from langchain.agents import create_agent, AgentState
from ai_backend.schemas import (
    Context,
    FlowGraphState,
    FlowResult,
    SearchResult,
    ProductFlowSteps,
    ProductFlowConfig,
)
from langgraph.types import RetryPolicy
from langgraph.runtime import Runtime
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
    If one of the query items is contained in any specified column value, the item is returned.
    Try to use short query items, ideally only one word per item. But multiple items."""

    tool_calls = len([m for m in state["messages"] if m.type == "tool"])

    if tool_calls >= 10:
        raise ToolException("Max tries (10) for this tool reached.")

    if tool_calls >= 5:
        return "search_product Tool call limit exceeded. Now return the result with the related_products and your confidence score."

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

        sqlQuery = f'SELECT {select_columns} FROM "{table_name}" WHERE {where_clause};'

        rows = await conn.fetch(sqlQuery, search_patterns)
        rows_dicts = [dict(row) for row in rows]
        print(
            f"🛠️ search_product ({tool_calls}): {table_name}, {search_columns}, {return_columns}, {query} -> {rows_dicts}"
        )
        return rows_dicts


async def db_step(
    state: FlowGraphState[ProductFlowConfig], runtime: Runtime[Context]
) -> dict:
    """Tries to find products from the database that are the ones the customer is talking about"""

    category = state.category_config

    agent = create_agent(
        model=runtime.context.complex_model,
        response_format=SearchResult,
        tools=[search_product],
        context_schema=Context,
    )
    conversation = [
        HumanMessage(format_email(runtime.context.email)),
        SystemMessage(f"""Identify which products from the database the customer refers to in this category.
        Only use email content relevant to '{category.name}: {category.description}' and ignore other parts.
        Use the category description as the strict scope boundary.
        Use the search_product tool to find candidates, based on the provided database schema.
        Never invent products that were not returned by the tool.
        Prefer one tool call with a query list containing multiple keywords/variants (customer wording, translations, abbreviations, core nouns).
        Keep tool usage efficient: avoid repeated equivalent searches, and only search again if ambiguity remains.
        If one product is clearly intended, return only that product with high confidence.
        If multiple plausible products remain, return those candidates with moderate/low confidence.
        If no plausible product is found, return an empty related_products list with low confidence."""),
        SystemMessage(f"""Database Schema: {runtime.context.db_schema}"""),
    ]

    if category.flow.db_step_prompt:
        conversation.append(SystemMessage(category.flow.db_step_prompt))

    result = await agent.ainvoke(
        {"messages": conversation},
        context=runtime.context,
    )

    # TODO: Sometimes it doesnt finish with 4o-mini and if it does not find the right products. Maybe try to debug with streaming.

    for msg in result["messages"]:
        msg.pretty_print()

    return {"steps": {"db_step": result["structured_response"]}}


product_subgraph = (
    StateGraph(
        FlowGraphState[ProductFlowConfig],
        output_schema=FlowResult[ProductFlowSteps],
        context_schema=Context,
    )
    .add_node(db_step, retry_policy=RetryPolicy(max_attempts=3))
    .add_node(structured_response)
    .add_node(summary)
    .add_node(email_response)
    .add_edge(START, "db_step")
    .add_edge(START, "summary")
    .add_edge("db_step", "structured_response")
    .add_edge("db_step", "email_response")
    .add_edge(["structured_response", "summary", "email_response"], END)
    .compile()
)


async def product_flow(state: FlowGraphState, runtime: Runtime[Context]) -> dict:
    """Flow that additionally tries to find products in the database. Plus summary and structured response"""

    print(f"▶️ START product flow Category {state.category_config}")

    raw_response = await product_subgraph.ainvoke(state, context=runtime.context)

    # Check if really valid and make ty happy
    response = FlowResult[ProductFlowSteps](**raw_response)

    print(f"✔️ END Category {state.category}")

    return {"category_results": [response]}
