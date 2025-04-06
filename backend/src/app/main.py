from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel
from fastapi.responses import JSONResponse
from src.utills import generate_domains, postprocessing
from typing import List

app= FastAPI()

origins=["http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


class Prompt(BaseModel):
    prompt: str

# Mockup domain generation
# def generate_domains(prompt: str) -> List[str]:
#     # Generate domain names based on the prompt (for now, return the static list)
#     return [
#         "Lakshitha", "MoneyMind", "WealthWise", "CashClever", 
#         "EconoSavvy", "FiscalFriend", "ProsperityPath", "InvestInsight",
#         "BudgetBoss", "CashCraft"
#     ]

# # Post-processing mockup (could include cleaning or formatting)
# def postprocessing(domains: List[str]) -> List[str]:
#     return domains  # This is where you could modify the domain names if necessary

@app.post("/generate-domains/")
async def generate_domains_endpoint(prompt: Prompt):
    domains = generate_domains(prompt.prompt)
    domain_names = postprocessing(domains)
    return {"domains": domain_names}




if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)