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


class ProductInquiry(BaseModel):
    """The user wants to buy a product or asks for general product information."""

    category: Literal["Product_Inquiry"]
    products: list[Product]


class Issue(BaseModel):
    product_name: str
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
