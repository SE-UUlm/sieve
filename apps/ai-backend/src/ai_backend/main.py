from pydantic import BaseModel
from typing import Literal
from ai_backend.schemas import AnalyzeEmailRequest, GraphOutput
import os
import asyncpg
from ai_backend.agent import run_analyze_email_agent
from fastapi import FastAPI


def create_pool():
    pool = asyncpg.create_pool(  # TODO when no configured, skip
        user=os.environ.get("PRODUCT_DB_USERNAME"),
        password=os.environ.get("PRODUCT_DB_PASSWORD"),
        database=os.environ.get("PRODUCT_DB_NAME"),
        host=os.environ.get("PRODUCT_DB_HOST"),
        port=os.environ.get("PRODUCT_DB_PORT"),
        min_size=1,
        max_size=10,
    )
    print("Database pool created")

    return pool


app = FastAPI()


class AnalyzeResult(BaseModel):
    status: Literal["success"]
    data: GraphOutput


@app.post("/analyze-email")
async def analyze_email(request: AnalyzeEmailRequest) -> AnalyzeResult:
    # Use a separate pool for each request to allow dynamic credentials from backend in the future
    async with create_pool() as pool:
        result = await run_analyze_email_agent(
            analyseRequest=request,
            db_pool=pool,
        )
        return AnalyzeResult(status="success", data=result)
