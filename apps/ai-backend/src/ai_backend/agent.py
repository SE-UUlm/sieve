import pprint
from langchain.agents import create_agent
from langchain.messages import HumanMessage
from langchain.chat_models import init_chat_model
from pydantic import BaseModel, Field
from typing import Literal, Union
from dotenv import load_dotenv

load_dotenv()


class Other(BaseModel):
    """The email does not match any of the other categories"""

    category: Literal["Other"]
    summary: str


class Complaint(BaseModel):
    """The user expresses dissatisfaction, frustration or is serious and angry"""

    category: Literal["Complaint"]
    complaints: list[str] = Field(description="Only one item per individual complaint")


class Product(BaseModel):
    product_name: str
    quantity: int


class ProductInquiry(BaseModel):
    """The user asks about a product they do not yet own, are considering buying, or want general information about."""

    category: Literal["Product_Inquiry"]
    products: list[Product]


class Issue(BaseModel):
    product_name: str
    issue: str = Field(description="Ah short summary of the issue")


class ProductSupport(BaseModel):
    """The user asks a specific question about an existing product they already have, use, or reference."""

    category: Literal["Product_Support"]
    issues: list[Issue]


class ResponseFormat(BaseModel):
    data: Union[ProductInquiry, ProductSupport, Complaint, Other]


model = init_chat_model(
    model="gpt-4o-mini", temperature=0.1, timeout=10, max_tokens=10000
)

system_prompt = """Your job is to categorize a given email from a customer or potential customer and convert it into a structured form. 
    If none of the categories match, classify the email as 'Other'.
    Write answers in the third person about the customer. Be as concise as possible.
    Language: English"""

agent = create_agent(
    model=model,
    system_prompt=system_prompt,
    response_format=ResponseFormat,
)


async def run_analyze_email_agent(email: str):
    conversation = [HumanMessage(email)]
    result = await agent.ainvoke({"messages": conversation})
    pprint.pp(result)
    return result["structured_response"].data
