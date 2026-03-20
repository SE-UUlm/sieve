from ai_backend.shared_flow import summary, structured_response
from langchain.tools import ToolRuntime
from ai_backend.schemas import FlowGraphState, FlowResult, Context, SimpleFlowSteps
from langgraph.graph import StateGraph, START, END


simple_subgraph = (
    StateGraph(FlowGraphState, output_schema=FlowResult[SimpleFlowSteps])
    .add_node("structured_response", structured_response)
    .add_node("summary", summary)
    .add_edge(START, "summary")
    .add_edge(START, "structured_response")
    .add_edge(["summary", "structured_response"], END)
    .compile()
)


async def simple_flow(state: FlowGraphState, runtime: ToolRuntime[Context]) -> dict:
    """Flow that only does summary and structured response"""

    print(f"▶️ START simple flow Category {state.category}")

    response: FlowResult[SimpleFlowSteps] = await simple_subgraph.ainvoke(state)

    print(f"✔️ END Category {state.category} Result: ", response)

    return {"results": [response]}
