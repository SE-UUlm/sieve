from ai_backend.agent import run_analyze_email_agent
from fastapi import FastAPI
from pydantic import BaseModel, Field


class Email(BaseModel):
    subject: str | None = Field(default=None, max_length=300)
    body: str = Field(..., min_length=1, max_length=10000)


app = FastAPI()


@app.get("/")
def read_root():
    return {"Hello": "This", "Is": "The", "AI-Backend": ":)"}


@app.post("/analyze-email")
async def analyze_email(email: Email):
    result = await run_analyze_email_agent(subject=email.subject, body=email.body)
    return {"status": "success", "data": result}
