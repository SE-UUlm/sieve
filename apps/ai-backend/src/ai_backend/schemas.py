from langchain.chat_models import BaseChatModel
import operator
from asyncpg import Pool
from dataclasses import dataclass
from typing import Literal, Union, Any, Annotated, TypeVar, Generic

from pydantic import BaseModel, Field

## Analyze Request ##


class Email(BaseModel):
    subject: str | None = Field(default=None, max_length=300)
    body: str = Field(min_length=1, max_length=10000)


Provider = Literal["OPENAI", "GOOGLE_VERTEX_AI", "ANTHROPIC"]


class ModelConfig(BaseModel):
    provider: Provider
    api_key: str = Field(min_length=1, max_length=500)
    simple_model: str = Field(min_length=1, max_length=100)
    complex_model: str = Field(min_length=1, max_length=100)


class SimpleFlowConfig(BaseModel):
    name: Literal["simple"]
    structured_response_schema: dict[str, Any]
    structured_response_prompt: str | None = Field(None, max_length=1000)
    summary_prompt: str | None = Field(None, max_length=1000)
    email_response_prompt: str | None = Field(None, max_length=1000)


class ProductFlowConfig(BaseModel):
    name: Literal["product"]
    structured_response_schema: dict[str, Any]
    structured_response_prompt: str | None = Field(None, max_length=1000)
    summary_prompt: str | None = Field(None, max_length=1000)
    db_step_prompt: str | None = Field(None, max_length=1000)
    email_response_prompt: str | None = Field(None, max_length=1000)


FlowConfig = Union[SimpleFlowConfig, ProductFlowConfig]

FlowConfigType = TypeVar("FlowConfigType", bound=FlowConfig)


class CategoryConfig(BaseModel, Generic[FlowConfigType]):
    name: str = Field(min_length=1, max_length=32)
    description: str = Field(max_length=1000)
    flow: FlowConfigType


Categories = list[CategoryConfig]


class GlobalConfig(BaseModel):
    overall_email_response_prompt: str | None = Field(None, max_length=1000)


class AnalyzeEmailRequest(BaseModel):
    email: Email
    model: ModelConfig
    categories: Categories
    config: GlobalConfig


## LangGraph Schemas ##


## Product Flow Schemas
class Product(BaseModel):
    product_name: str
    product_id: str | None = Field(
        default=None, description="If not known, set to null"
    )
    product_category: str | None = Field(
        default=None, description="If not known, set to null"
    )
    metadata: dict[str, Any] | None = Field(
        default=None,
        description="Use a json object directly, not a string. If not known, set to null",
    )
    price: float | None = Field(default=None, description="If not known, set to null")


class SearchResult(BaseModel):
    related_products: list[Product] = Field(
        description="Products from the search you think are the ones the customer was talking about"
    )
    confidence: float = Field(
        description="How confident you are that the products you found are the ones the customer meant"
    )
    agent_remarks: str = Field(
        min_length=1,
        max_length=400,
        description="Concise notes from the agent on how well they could execute the customer's search request. Max 250 characters.",
    )


class EmailResponsePart(BaseModel):
    response_body_part: str = Field(
        description="Part of the drafted email response to the customer"
    )


class EmailResponsePartSchema(BaseModel):
    result: EmailResponsePart | None


## Flow Graph:
class SimpleFlowSteps(BaseModel):
    summary: str
    email_response: EmailResponsePart | None = Field(default=None)


class ProductFlowSteps(BaseModel):
    summary: str
    db_step: SearchResult
    email_response: EmailResponsePart | None = Field(default=None)


FlowSteps = Union[SimpleFlowSteps, ProductFlowSteps]

FlowType = TypeVar("FlowType", bound=FlowSteps)


class FlowResult(BaseModel, Generic[FlowType]):
    category: str
    structured_output: Any
    steps: FlowType


class FlowGraphState(BaseModel, Generic[FlowConfigType]):
    category: str
    category_config: CategoryConfig[FlowConfigType]
    steps: Annotated[dict[str, Any], operator.ior] = dict()


## Top Level Graph:
@dataclass
class Context:
    db_pool: Pool
    db_schema: dict[str, list[str]]
    simple_model: BaseChatModel
    complex_model: BaseChatModel
    email: Email
    categories: Categories
    global_config: GlobalConfig


class EmailResponse(BaseModel):
    response_body: str = Field(description="Email body of the response to the customer")
    response_subject: str = Field(
        description="Email subject of the response to the customer"
    )


class EmailResponseSchema(BaseModel):
    result: EmailResponse | None


class ConfidenceAssessment(BaseModel):
    score: int | None = Field(
        default=None,
        ge=0,
        le=100,
        description="Conservative confidence score for the overall drafted response (0-100)",
    )
    rationale: str = Field(
        min_length=1,
        max_length=240,
        description="One short English sentence explaining the score",
    )


class GraphOutput(BaseModel):
    category_results: Annotated[list[FlowResult], operator.add] = []
    email_response: EmailResponse | None = Field(default=None)
    confidence_assessment: ConfidenceAssessment = Field(
        default_factory=lambda: ConfidenceAssessment(
            score=None,
            rationale="Confidence assessment is not applicable because no overall email response was generated.",
        )
    )


class GraphState(GraphOutput):
    categories: list[str] = []
