from fastapi import FastAPI
from pydantic import BaseModel

class Email(BaseModel):
    body: str

app = FastAPI()


@app.get("/")
def read_root():
    return {"Hello": "This", "Is": "The", "AI-Backend": ":)"}


@app.post("/analyze-email")
def analyze_email(email: Email):
    return {"status": "success", "result": email}
