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

domain_details = {
    'domainName': "FinanceFly.lk",
    'domainDescription': [
      "FinanceFly is a dynamic and innovative financial management platform designed to help individuals and businesses take control of their financial future.",
      "The name combines 'Finance' with 'Fly,' symbolizing the ability to elevate financial operations to new heights with speed and precision. Whether it's streamlining daily budgeting, tracking expenses, or making informed investment decisions, FinanceFly aims to provide users with a seamless and intuitive experience.",
      "With a focus on user-friendly design and cutting-edge technology, FinanceFly empowers users to make smarter financial choices, optimize their wealth, and achieve their goals faster."
    ],
    'relatedFields': [
      "Personal Finance Management",
      "Budgeting Tools",
      "Financial Planning & Advisory",
      "Expense Tracking Solutions",
      "Investment & Portfolio Management"
    ]
}

@app.post("/generate-domains/")
async def generate_domains_endpoint(prompt: Prompt):
    domains = generate_domains(prompt.prompt)
    domain_names = postprocessing(domains)
    return {"domains": domain_names}




# Example LLM function that generates domain details (replace with your own)
def get_domain_details_from_llm(domain_name: str, user_prompt: str) -> dict:
    # Simulate LLM function call (replace this with your actual function)
    domain_description = f"Details for {domain_name} based on prompt: {user_prompt}."
    related_fields = ["Technology", "Business", "Education"]
    return domain_details

# API route to fetch domain details by domain name and user prompt
@app.post("/details/")
async def get_domain_details():
    domain_data = get_domain_details_from_llm('Lakshitha','Prompt')  # Use both domain name and prompt
    return domain_data



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)