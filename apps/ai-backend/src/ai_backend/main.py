from dotenv import load_dotenv
from pydantic import BaseModel, Field
from typing import Literal
from ai_backend.schemas import AnalyzeEmailRequest, GraphOutput, ModelConfig
import os
import asyncpg
import httpx
import anthropic
import openai
from ai_backend.agent import (
    run_analyze_email_agent,
    init_simple_model,
    init_complex_model,
)
from fastapi import FastAPI
from google.api_core.exceptions import ClientError as GoogleClientError

load_dotenv()


async def create_pool():
    if not os.environ.get("PRODUCT_DB_NAME"):
        print("No product database configured. Product Flow will not work")
        return None

    pool = await asyncpg.create_pool(
        user=os.environ.get("PRODUCT_DB_USERNAME"),
        password=os.environ.get("PRODUCT_DB_PASSWORD"),
        database=os.environ.get("PRODUCT_DB_NAME"),
        host=os.environ.get("PRODUCT_DB_HOST"),
        port=os.environ.get("PRODUCT_DB_PORT"),
        min_size=0,
        max_size=5,
    )
    print("Database pool created")

    return pool


app = FastAPI()


class AnalyzeResult(BaseModel):
    status: Literal["success"]
    data: GraphOutput


class ValidateModelRequest(BaseModel):
    provider: Literal["OPENAI", "GOOGLE_VERTEX_AI", "ANTHROPIC"]
    api_key: str = Field(..., min_length=1, max_length=500)
    model: str = Field(..., min_length=1, max_length=200)


class ValidateModelResult(BaseModel):
    is_available: bool


def is_invalid_model_error(error: BaseException) -> bool:
    if isinstance(error, (openai.BadRequestError, openai.NotFoundError)):
        return True
    if isinstance(error, (anthropic.BadRequestError, anthropic.NotFoundError)):
        return True
    if isinstance(error, GoogleClientError):
        return True
    if isinstance(error, httpx.HTTPStatusError):
        return True

    return False


@app.post("/analyze-email")
async def analyze_email(request: AnalyzeEmailRequest) -> AnalyzeResult:
    # Use a separate pool for each request to allow dynamic credentials from backend in the future
    pool = await create_pool()
    try:
        result = await run_analyze_email_agent(
            analyseRequest=request,
            db_pool=pool,
        )
        return AnalyzeResult(status="success", data=result)
    finally:
        if pool:
            await pool.close()


@app.post("/validate-model")
async def validate_model(request: ValidateModelRequest) -> ValidateModelResult:
    model_config = ModelConfig(
        provider=request.provider,
        api_key=request.api_key,
        simple_model=request.model,
        complex_model=request.model,
    )

    simple_model = init_simple_model(model_config)
    complex_model = init_complex_model(model_config)

    try:
        await simple_model.ainvoke("Ping")
        await complex_model.ainvoke("Ping")
    except BaseException as error:
        if is_invalid_model_error(error):
            return ValidateModelResult(is_available=False)
        raise

    return ValidateModelResult(is_available=True)
