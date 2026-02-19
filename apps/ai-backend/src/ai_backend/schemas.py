from typing import Literal, Union

from pydantic import BaseModel, Field


class Other(BaseModel):
    """The email does not match any of the other categories."""

    category: Literal["Other"]
    summary: str


class Complaint(BaseModel):
    """The user expresses dissatisfaction, frustration or is serious and angry."""

    category: Literal["Complaint"]
    complaints: list[str] = Field(description="Only one item per individual complaint")


class Product(BaseModel):
    product_name: str
    quantity: int
    product_id: str = Field(description="If not known, leave empty")
    product_category: str = Field(description="If not known, leave empty")
    number_of_parts: int = Field(description="If not known, leave empty")


class ProductInquiry(BaseModel):
    """The user wants to buy a product or asks for general product information. Use the provided 'related products' to fill out the products list"""

    category: Literal["Product_Inquiry"]
    products: list[Product]
    question: str | None
    answer: str | None = Field(
        description="If the customer asked a question and you can answer the question based on the provided product details, then answer here"
    )


class Issue(BaseModel):
    product: Product
    issue: str = Field(description="A short summary of the issue")


class ProductSupport(BaseModel):
    """The user asks about an existing product they already have or use."""

    category: Literal["Product_Support"]
    issues: list[Issue]


ResponseFormatData = Union[
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
