from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
from main import generate_module  # your existing main.py function

app = FastAPI(title="Agents API")

class GenerateRequest(BaseModel):
    description: Optional[str] = None

@app.post("/generate")
async def generate(req: GenerateRequest):
    """
    Run your agents and return the generated module + problems as JSON.
    Node.js will save them in the database.
    """
    try:
        quiz_module = await generate_module(req.description)
        return {"module": quiz_module}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    return {"status": "ok"}
