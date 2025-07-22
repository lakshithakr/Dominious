from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from pymongo import MongoClient
from fastapi import Request
import pytz
from typing import Optional
from datetime import datetime
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

MONGO_URI = "mongodb+srv://lakshitha20:Laki1234@cluster0.zzd6wpz.mongodb.net/"
client = MongoClient(MONGO_URI)
db = client["smartname"]
feedback_collection = db["feedbacks"]
search_log_collection = db["search_logs"]

class Prompt(BaseModel):
    prompt: str

class DetailRequest(BaseModel):
    prompt: str
    domain_name: str

class Feedback(BaseModel):
    rating: int
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    comment: str

@app.post("/submit-feedback/")
def submit_feedback(feedback: Feedback):
    feedback_data = feedback.dict()
    # Define Sri Lankan timezone
    sri_lanka_tz = pytz.timezone("Asia/Colombo")
    # Get current time in Sri Lankan timezone
    feedback_data["submitted_at"] = datetime.now(sri_lanka_tz).strftime("%Y-%m-%d %H:%M:%S")
    feedback_collection.insert_one(feedback_data)
    return {"message": "Feedback saved successfully"}


@app.post("/generate-domains/")
async def generate_domains_endpoint(prompt: Prompt,request: Request):

    samples=RAG(prompt.prompt)
    # print(samples)
    # output=gemma(prompt.prompt,samples)
    # domain_names=gemma_post_processing(output)   # for  Gemma

    domains = generate_domains(prompt.prompt,samples)
    domain_names = postprocessing(domains)
    #print(domain_names)
    #domain_names=RAG(prompt.prompt)
    print(domain_names)
    domain_names=is_domain_names_available(domain_names)
    print(domain_names)

    sri_lanka_tz = pytz.timezone("Asia/Colombo")
    timestamp = datetime.now(sri_lanka_tz).strftime("%Y-%m-%d %H:%M:%S")
    ip_address = request.client.host

    log_entry = {
        "search_query": prompt.prompt,
        "domain_recommendations": domain_names,
        "ip_address": ip_address,
        "timestamp": timestamp
    }
    search_log_collection.insert_one(log_entry)
    return {"domains": domain_names}

@app.post("/details/")
async def get_domain_details(request: DetailRequest):
    dd=domain_details(request.domain_name,request.prompt)


    # dd,domain_name=gemma_decsription(request.domain_name,request.prompt)
    # dd=gemma_preprocess(dd,domain_name) # for gemma
    return dd

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8001)
