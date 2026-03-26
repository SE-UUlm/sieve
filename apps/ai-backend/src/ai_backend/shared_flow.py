from ai_backend.utils import format_email, dict_to_json
from langchain.messages import SystemMessage, HumanMessage
from langgraph.runtime import Runtime
from ai_backend.schemas import FlowGraphState, Context, EmailResponsePartSchema


async def summary(state: FlowGraphState, runtime: Runtime[Context]) -> dict:
    messages = [
        HumanMessage(format_email(runtime.context.email)),
        SystemMessage(
            f"""Your job is to summarize the part of the customer's email that relates to the category '{state.category_config.name}: {state.category_config.description}' and ignore other parts."""
        ),
    ]

    summary_prompt = state.category_config.flow.summary_prompt
    if summary_prompt:
        messages.append(SystemMessage(summary_prompt))

    result = await runtime.context.simple_model.ainvoke(messages)

    return {"steps": {"summary": result.content}}


async def structured_response(state: FlowGraphState, runtime: Runtime[Context]) -> dict:
    schema = dict(
        state.category_config.flow.structured_response_schema
    )  # Copy before modifying

    # top level title of json schema cannot contain spaces, because OpenAI does not like that. So we'll replace them with underscores
    if "title" in schema:
        schema["title"] = schema["title"].replace(" ", "_")
    else:  # top level title is required. Generate if not exists
        schema["title"] = state.category_config.name.replace(" ", "_")

    structured = runtime.context.simple_model.with_structured_output(schema)

    json_string = dict_to_json(state.steps)

    messages = [
        HumanMessage(format_email(runtime.context.email)),
        SystemMessage(
            f"""Your job is to convert a customer's email into a structured form. Only use the parts of the email that relates to the category '{state.category_config.name}: {state.category_config.description}' and ignore other parts."""
        ),
        SystemMessage("Related information: " + json_string),
    ]

    if state.category_config.flow.structured_response_prompt:
        messages.append(
            SystemMessage(state.category_config.flow.structured_response_prompt)
        )

    result = await structured.ainvoke(messages)
    return {"structured_output": result}


async def email_response(state: FlowGraphState, runtime: Runtime[Context]) -> dict:
    category = state.category_config

    structured = runtime.context.complex_model.with_structured_output(
        EmailResponsePartSchema
    )

    conversation = [
        HumanMessage(format_email(runtime.context.email)),
        SystemMessage(f"""Your job is to draft an email response to the customer. This can only contain things that you are explicitly told to include.
        Only respond to the parts of the email that relates to the category '{category.name}: {category.description}' and ignore other parts.
        Do not draft a complete email, only a section."""),
        SystemMessage(f"Related information: : {dict_to_json(state.steps)}"),
    ]

    if category.flow.email_response_prompt:
        conversation.append(SystemMessage(category.flow.email_response_prompt))

    result = await structured.ainvoke(conversation)
    assert isinstance(
        result, EmailResponsePartSchema
    )  # Tell ty that this an EmailResponseSchema

    return {"steps": {"email_response": result.result}}
