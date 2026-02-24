from langchain.tools import tool
import pprint
from langchain.agents import create_agent
from langchain.messages import HumanMessage, SystemMessage
from langchain.chat_models import init_chat_model
from dotenv import load_dotenv
from ai_backend.schemas import ResponseFormat, ResponseFormatData, SearchResult

load_dotenv()


@tool
def search_product(query: str):
    """Useful to search for product information, product categories. Use one keyword for search. The database only contains lego sets. The products in the database are named in german"""
    with open("legosets.txt") as f:
        s = f.read()
        lines = s.split("\n")
        keywords = query.split(" ")
        keywords = [x.strip().lower() for x in keywords]
        keywords = [x for x in keywords if x != "lego"]
        filtered = [x for x in lines if any(k in x.lower() for k in keywords)]
        print(f"🛠️ search_product: {query} -> {filtered}")
        return filtered


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
    Use the search_product tool to find the products. Try multiple times with different keywords, variants, translations until you think you found the products the customer wants. 
    If you think you found the right products return them using the provided output format. Together with your confidence score.
    Answer Language: English"""
    return create_agent(
        model=model,
        system_prompt=system_prompt,
        response_format=SearchResult,
        tools=[search_product],
    )


def _build_email_for_analysis(subject: str | None, body: str) -> str:
    if subject is None or subject.strip() == "":
        return f"Email body:\n{body}"

    return f"Email subject:\n{subject}\n\nEmail body:\n{body}"


async def run_analyze_email_agent(
    api_key: str, subject: str | None, body: str
) -> ResponseFormatData:
    formatted_email = _build_email_for_analysis(subject=subject, body=body)

    model = _build_model(api_key)

    search_agent = _build_search_agent(model)
    conversation = [HumanMessage(formatted_email)]
    result = await search_agent.ainvoke({"messages": conversation})
    pprint.pp(result)

    print("🔎 search agent result:\n" + result["structured_response"].model_dump_json())

    response_agent = _build_response_agent(model)
    conversation = [
        SystemMessage(
            "Related products: \n"
            + result[
                "structured_response"
            ].model_dump_json()  # TODO: auf Agent State umbauen
        ),
        HumanMessage(formatted_email),
    ]
    result = await response_agent.ainvoke({"messages": conversation})
    pprint.pp(result)
    return result["structured_response"].data
