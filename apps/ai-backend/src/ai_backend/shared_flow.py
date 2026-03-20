from pydantic import TypeAdapter
from ai_backend.utils import format_email, get_category_flow, get_category
from langchain.messages import SystemMessage, HumanMessage
from langchain.tools import ToolRuntime
from ai_backend.schemas import FlowGraphState, Context


async def summary(state: FlowGraphState, runtime: ToolRuntime[Context]) -> dict:
    category = get_category(state.category, runtime.context.categories)

    result = await runtime.context.simple_model.ainvoke(
        [
            SystemMessage(f"""Your job is to summarize the part of the customer's email that relates to the category '{category.name}: {category.description}' and ignore other parts.
            Be as concise as possible.
            Answer Language: English"""),
            HumanMessage(format_email(runtime.context.email)),
        ]
    )

    return {"steps": {"summary": result.content}}


async def structured_response(
    state: FlowGraphState, runtime: ToolRuntime[Context]
) -> dict:
    flow = get_category_flow(state.category, runtime.context.categories)
    # TODO: top level title of json schema cannot contain spaces, because OpenAI does not like that
    structured = runtime.context.simple_model.with_structured_output(
        flow.structured_response_schema
    )

    # Convert steps to json, this can contain pydantic objects or python dicts
    adapter = TypeAdapter(dict)
    json_bytes = adapter.dump_json(state.steps)
    json_string = json_bytes.decode()

    category = get_category(state.category, runtime.context.categories)

    result = await structured.ainvoke(
        [
            SystemMessage(
                f"""Your job is to convert a customer's email into a structured form. Only use the parts of the email that relates to the category '{category.name}: {category.description}' and ignore other parts.
                Respond in English. Be as concise as possible."""
            ),
            SystemMessage("Related information: " + json_string),
            HumanMessage(format_email(runtime.context.email)),
        ]
    )
    return {"structured_output": result}
