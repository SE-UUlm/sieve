import os
import asyncpg
from ai_backend.agent import run_analyze_email_agent
from fastapi import FastAPI
from pydantic import BaseModel, Field


def create_pool():
    pool = asyncpg.create_pool(
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


class Email(BaseModel):
    apiKey: str = Field(..., min_length=1, max_length=500)
    subject: str | None = Field(default=None, max_length=300)
    body: str = Field(..., min_length=1, max_length=10000)


app = FastAPI()


@app.post("/analyze-email")
async def analyze_email(email: Email):
    # Use a separate pool for each request to allow dynamic credentials from backend in the future
    async with create_pool() as pool:
        result = await run_analyze_email_agent(
            api_key=email.apiKey,
            subject=email.subject,
            body=email.body,
            db_pool=pool,
        )
        return {"status": "success", "data": result}
