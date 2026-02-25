import asyncpg
from dataclasses import dataclass
from typing import Literal, Union, Any

from pydantic import BaseModel, Field


@dataclass
class Context:
    db_pool: asyncpg.Pool


class Other(BaseModel):
    """The email does not match any of the other categories."""

    category: Literal["Other"]
    summary: str


class Complaint(BaseModel):
    """The user expresses dissatisfaction, frustration or is serious and angry."""

    category: Literal["Complaint"]
    complaints: list[str] = Field(description="Only one item per individual complaint")
    urgency: float


class Product(BaseModel):
    """Use the provided 'related products' to fill out the products, or if not matching, fill out only name and quantity with the user provided info."""

    product_name: str
    quantity: int
    product_id: str | None = Field(description="If not known, leave empty")
    product_category: str | None = Field(description="If not known, leave empty")
    metadata: dict[str, Any] | None = Field(description="If not known, leave empty")
    price: float | None = Field(description="If not known, leave empty")


class ProductOder(BaseModel):
    """The user has an immediate desire to order one or more specific products."""

    category: Literal["Product_Order"]
    products: list[Product] = Field(
        description="List the products the user wants to order"
    )
    urgency: float


class ProductInquiry(BaseModel):
    """The user wants to ask for information regarding a product they do not yet own or wants suggestion which product(s) to buy."""

    category: Literal["Product_Inquiry"]
    products: list[Product] = Field(
        description="List all Products from 'Related Products'"
    )
    question: str | None
    answer: str | None = Field(
        description="If the customer asked a question and you can answer the question based on the provided product details, then answer here"
    )
    urgency: float


class Issue(BaseModel):
    product: Product
    issue: str = Field(description="A short summary of the issue")
    urgency: float


class ProductSupport(BaseModel):
    """The user asks about an existing product they already have or use."""

    category: Literal["Product_Support"]
    issues: list[Issue]


ResponseFormatData = Union[
    ProductOder,
    ProductInquiry,
    ProductSupport,
    Complaint,
    Other,
]


class ResponseFormat(BaseModel):
    data: ResponseFormatData


class SearchResult(BaseModel):
    potentialProducts: list[Product] = Field(
        description="Products from the search you think are the ones the customer wanted"
    )
    confidence: float = Field(
        description="How confident you are that the products are the ones the customer wanted"
    )
