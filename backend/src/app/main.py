from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from src.utills import generate_domains, postprocessing, domain_details,RAG,gemma,gemma_post_processing,gemma_decsription,gemma_preprocess,is_domain_names_available

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

    samples=RAG(prompt.prompt)
    print(samples)
    # output=gemma(prompt.prompt,samples)
    # domain_names=gemma_post_processing(output)   # for  Gemma

    domains = generate_domains(prompt.prompt,samples)
    domain_names = postprocessing(domains)
    #print(domain_names)
    #domain_names=RAG(prompt.prompt)
    print(domain_names)
    domain_names=is_domain_names_available(domain_names)
    print(domain_names)
    return {"domains": domain_names}

@app.post("/details/")
async def get_domain_details(request: DetailRequest):
    dd=domain_details(request.domain_name,request.prompt)


    # dd,domain_name=gemma_decsription(request.domain_name,request.prompt)
    # dd=gemma_preprocess(dd,domain_name) # for gemma
    return dd

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
