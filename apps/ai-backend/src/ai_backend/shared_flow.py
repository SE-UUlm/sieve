from ai_backend.utils import format_email, dict_to_json
from langchain.messages import SystemMessage, HumanMessage
from langgraph.runtime import Runtime
from ai_backend.schemas import FlowGraphState, Context, EmailResponsePartSchema


async def summary(state: FlowGraphState, runtime: Runtime[Context]) -> dict:
    messages = [
        SystemMessage(
            f"""Summarize only the parts of the customer's email that are relevant to the category
            '{state.category_config.name}: {state.category_config.description}'.
            Treat the category description as the strict scope boundary.
            Return concise plain text with only factual details from the email (intent, constraints, quantities, questions).
            Ignore content that belongs to other categories and do not invent information."""
        ),
    ]

    summary_prompt = state.category_config.flow.summary_prompt
    if summary_prompt:
        messages.append(SystemMessage(summary_prompt))

    messages.append(HumanMessage(format_email(runtime.context.email)))

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
        SystemMessage(
            f"""Convert the customer's email into the requested structured output.
            Only use content relevant to the category '{state.category_config.name}: {state.category_config.description}'.
            Treat the category description as the strict scope boundary.
            Use related information as supporting evidence and keep your output consistent with it.
            Populate fields only when supported by evidence from the email or related information.
            Do not guess missing values; leave them null/empty as allowed by the schema."""
        )
    ]

    if state.category_config.flow.structured_response_prompt:
        messages.append(
            SystemMessage(state.category_config.flow.structured_response_prompt)
        )

    messages.append(SystemMessage("Related information: " + json_string))

    messages.append(HumanMessage(format_email(runtime.context.email)))

    result = await structured.ainvoke(messages)
    return {"structured_output": result}


async def email_response(state: FlowGraphState, runtime: Runtime[Context]) -> dict:
    category = state.category_config

    structured = runtime.context.complex_model.with_structured_output(
        EmailResponsePartSchema
    )

    conversation = [
        SystemMessage(f"""Draft only this category's section of a customer reply.
        Only respond to the parts of the email relevant to '{category.name}: {category.description}' and ignore other parts.
        Use only explicit facts from the customer's email and related information.
        Do not add new product facts, commitments, or assumptions.
        Ask clarification questions only when information is truly missing or ambiguous.
        If intent is already clear (for example, a single clear product match), do not ask unnecessary clarification questions.
        If this category should not produce a reply section, return null.
        Do not draft a full email; draft only a section.
        Use plain text, no markdown.""")
    ]

    if category.flow.email_response_prompt:
        conversation.append(SystemMessage(category.flow.email_response_prompt))

    conversation.append(
        SystemMessage(f"Related information: {dict_to_json(state.steps)}")
    )

    conversation.append(HumanMessage(format_email(runtime.context.email)))

    result = await structured.ainvoke(conversation)
    assert isinstance(
        result, EmailResponsePartSchema
    )  # Tell ty that this an EmailResponseSchema

    return {"steps": {"email_response": result.result}}
