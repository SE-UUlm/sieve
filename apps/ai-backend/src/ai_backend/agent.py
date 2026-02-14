import pprint
from langchain.agents import create_agent
from langchain.messages import HumanMessage
from langchain.chat_models import init_chat_model
from dotenv import load_dotenv
from ai_backend.schemas import ResponseFormat, ResponseFormatData

load_dotenv()


system_prompt = """Your job is to categorize a given email from a customer or potential customer and convert it into a structured form.
    If none of the categories match, classify the email as 'Other'.
    Write answers in the third person about the customer. Be as concise as possible.
    Answer Language: English"""


def _build_agent(api_key: str):
    model = init_chat_model(
        model="gpt-4o-mini",
        temperature=0.1,
        timeout=10,
        max_tokens=10000,
        api_key=api_key,
    )

    return create_agent(
        model=model,
        system_prompt=system_prompt,
        response_format=ResponseFormat,
    )


def _build_email_for_analysis(subject: str | None, body: str) -> str:
    if subject is None or subject.strip() == "":
        return f"Email body:\n{body}"

    return f"Email subject:\n{subject}\n\nEmail body:\n{body}"


async def run_analyze_email_agent(
    api_key: str, subject: str | None, body: str
) -> ResponseFormatData:
    agent = _build_agent(api_key=api_key)
    formatted_email = _build_email_for_analysis(subject=subject, body=body)
    conversation = [HumanMessage(formatted_email)]
    result = await agent.ainvoke({"messages": conversation})
    pprint.pp(result)
    return result["structured_response"].data
