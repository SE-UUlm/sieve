from fastapi import FastAPI
from pydantic import BaseModel
from dotenv import load_dotenv
load_dotenv()
from ai_backend.agent import run_analyze_email_agent


class Email(BaseModel):
    body: str

app = FastAPI()


@app.get("/")
def read_root():
    return {"Hello": "This", "Is": "The", "AI-Backend": ":)"}


@app.post("/analyze-email")
async def analyze_email(email: Email):
    result = await run_analyze_email_agent(email.body)
    return {"status": "success", "result": result}
