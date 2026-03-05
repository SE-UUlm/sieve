from langchain.chat_models import BaseChatModel
import operator
import asyncpg
from dataclasses import dataclass
from typing import Literal, Union, Any, TypedDict, Annotated

from pydantic import BaseModel, Field


@dataclass
class Context:
    db_pool: asyncpg.Pool
    db_schema: dict[str, list[str]]
    simple_model: BaseChatModel
    complex_model: BaseChatModel


class Other(BaseModel):
    """The email does not match any of the other categories."""

    summary: str


class Complaint(BaseModel):
    """The user expresses dissatisfaction, frustration or is serious and angry."""

    complaints: list[str] = Field(description="Only one item per individual complaint")
    urgency: int = Field(
        description="How urgent is the complaint from 0 (not urgent) to 100 (very urgent)"
    )


class Product(BaseModel):
    """Use the provided 'related products' to fill out the products, or if not matching, fill out only name and quantity with the user provided info."""

    product_name: str
    quantity: int
    product_id: str | None = Field(
        default=None, description="If not known, leave empty"
    )
    product_category: str | None = Field(
        default=None, description="If not known, leave empty"
    )
    metadata: dict[str, Any] | None = Field(
        default=None, description="If not known, leave empty"
    )
    price: float | None = Field(default=None, description="If not known, leave empty")


class ProductInquiry(BaseModel):
    """The user wants to order a product or wants to ask for information regarding a product they do not yet own or wants suggestion which product(s) to buy."""

    products: list[Product] = Field(
        description="List all Products from 'Related Products'"
    )
    question: str | None = Field(default=None)
    answer: str | None = Field(
        default=None,
        description="If the customer asked a question and you can answer the question based on the provided product details, then answer here",
    )
    urgency: int = Field(
        description="How urgent is the complaint from 0 (not urgent) to 100 (very urgent)"
    )


class Issue(BaseModel):
    product: Product
    issue: str = Field(description="A short summary of the issue")
    urgency: int = Field(
        description="How urgent is the complaint from 0 (not urgent) to 100 (very urgent)"
    )


class ProductSupport(BaseModel):
    """The user asks about an existing product they already have or use."""

    issues: list[Issue]


ResponseFormatData = Union[
    ProductInquiry,
    ProductSupport,
    Complaint,
    Other,
]


class ResponseFormat(BaseModel):
    data: ResponseFormatData


## Neu ##


class SearchResult(BaseModel):
    potentialProducts: list[Product] = Field(
        description="Products from the search you think are the ones the customer wanted"
    )
    confidence: float = Field(
        description="How confident you are that the products are the ones the customer wanted"
    )


Category = Literal["Product_Inquiry", "Product_Support", "Complaint", "Other"]


class CategorizationResult(BaseModel):
    """Result of classifying a customer email into categories."""

    categories: list[Category] = Field(
        description="List of Categories that match the customers email"
    )


class Email(BaseModel):
    subject: str | None
    body: str


class FlowResult(BaseModel):
    category: Category
    structured_output: Any
    steps: dict[str, Any]


class SubGraphState(BaseModel):
    email: Email
    category: Category
    result: Any | None = None
    related_products: list[Product] | None = None
    steps: dict[str, Any] = dict()


class RouterState(BaseModel):
    email: Email
    categories: list[Category] | None = None
    results: Annotated[list[FlowResult], operator.add] = []
