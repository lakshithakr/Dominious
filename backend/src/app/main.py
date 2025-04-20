from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from src.utills import generate_domains, postprocessing, domain_details

app = FastAPI()

origins = ["http://localhost:3000"]  # Adjust if your frontend is hosted elsewhere

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

class Prompt(BaseModel):
    prompt: str

class DetailRequest(BaseModel):
    prompt: str
    domain_name: str

@app.post("/generate-domains/")
async def generate_domains_endpoint(prompt: Prompt):
    domains = generate_domains(prompt.prompt)
    domain_names = postprocessing(domains)
    return {"domains": domain_names}

@app.post("/details/")
async def get_domain_details(request: DetailRequest):
    dd=domain_details(request.domain_name,request.prompt)
    return dd

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
