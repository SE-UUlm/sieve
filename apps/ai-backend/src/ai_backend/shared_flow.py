from pydantic import TypeAdapter
from ai_backend.utils import format_email, get_category
from langchain.messages import SystemMessage, HumanMessage
from langgraph.runtime import Runtime
from ai_backend.schemas import FlowGraphState, Context


async def summary(state: FlowGraphState, runtime: Runtime[Context]) -> dict:
    category = get_category(state.category, runtime.context.categories)

    messages = [
        SystemMessage(
            f"""Your job is to summarize the part of the customer's email that relates to the category '{category.name}: {category.description}' and ignore other parts."""
        ),
    ]

    summary_prompt = category.flow.summary_prompt
    if summary_prompt:
        messages.append(SystemMessage(summary_prompt))

    messages.append(HumanMessage(format_email(runtime.context.email)))

    result = await runtime.context.simple_model.ainvoke(messages)

    return {"steps": {"summary": result.content}}


async def structured_response(state: FlowGraphState, runtime: Runtime[Context]) -> dict:
    category = get_category(state.category, runtime.context.categories)
    schema = category.flow.structured_response_schema

    # top level title of json schema cannot contain spaces, because OpenAI does not like that. So we'll replace them with undescores
    schema["title"] = schema["title"].replace(" ", "_")

    structured = runtime.context.simple_model.with_structured_output(schema)

    # Convert steps to json, this can contain pydantic objects or python dicts
    adapter = TypeAdapter(dict)
    json_bytes = adapter.dump_json(state.steps)
    json_string = json_bytes.decode()

    messages = [
        SystemMessage(
            f"""Your job is to convert a customer's email into a structured form. Only use the parts of the email that relates to the category '{category.name}: {category.description}' and ignore other parts."""
        ),
        SystemMessage("Related information: " + json_string),
    ]

    if category.flow.structured_reponse_prompt:
        messages.append(SystemMessage(category.flow.structured_reponse_prompt))

    messages.append(HumanMessage(format_email(runtime.context.email)))

    result = await structured.ainvoke(messages)
    return {"structured_output": result}
