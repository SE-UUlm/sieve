import os
import asyncpg
from fastapi.concurrency import asynccontextmanager
from ai_backend.agent import run_analyze_email_agent
from fastapi import FastAPI
from pydantic import BaseModel, Field


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.db = await asyncpg.create_pool(
        user=os.environ.get("PRODUCT_DB_USERNAME"),
        password=os.environ.get("PRODUCT_DB_PASSWORD"),
        database=os.environ.get("PRODUCT_DB_NAME"),
        host=os.environ.get("PRODUCT_DB_HOST"),
        port=os.environ.get("PRODUCT_DB_PORT"),
        min_size=1,
        max_size=10,
    )
    print("Database pool created")

    yield

    # Shutdown
    await app.state.db.close()
    print("Database pool closed")


class Email(BaseModel):
    apiKey: str = Field(..., min_length=1, max_length=500)
    subject: str | None = Field(default=None, max_length=300)
    body: str = Field(..., min_length=1, max_length=10000)


app = FastAPI(lifespan=lifespan)


@app.get("/")
def read_root():
    return {"Hello": "This", "Is": "The", "AI-Backend": ":)"}


@app.post("/analyze-email")
async def analyze_email(email: Email):
    result = await run_analyze_email_agent(
        api_key=email.apiKey,
        subject=email.subject,
        body=email.body,
        db_pool=app.state.db,
    )
    return {"status": "success", "data": result}
