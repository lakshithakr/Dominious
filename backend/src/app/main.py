from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from pymongo import MongoClient
from fastapi import Request
from pydantic import BaseModel
import requests
import pytz
from typing import Optional, List, Union
from datetime import datetime
from src.utills import generate_domains, postprocessing, domain_details, RAG, gemma, gemma_post_processing, gemma_decsription, gemma_preprocess, is_domain_names_available, get_adjusted_first_syllable, extend_domain_names
import asyncio

app = FastAPI()

origins = ["http://localhost:3000"]

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
    domain_name: Union[str, List[str]]

class Feedback(BaseModel):
    rating: int
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    comment: str

class UsernameRequest(BaseModel):
    platform: str
    username: str

PLATFORM_URLS = {
    'youtube': 'https://www.youtube.com/@{}',
    'facebook': 'https://www.facebook.com/{}',
    'twitter': 'https://twitter.com/{}',
    'instagram': 'https://www.instagram.com/{}/'
}

@app.post("/submit-feedback/")
def submit_feedback(feedback: Feedback):
    feedback_data = feedback.dict()
    sri_lanka_tz = pytz.timezone("Asia/Colombo")
    feedback_data["submitted_at"] = datetime.now(sri_lanka_tz).strftime("%Y-%m-%d %H:%M:%S")
    feedback_collection.insert_one(feedback_data)
    return {"message": "Feedback saved successfully"}

class UsernameRequest(BaseModel):
    username: str

@app.post("/check/facebook")
def check_facebook_username(data: UsernameRequest):
    username = data.username.strip()
    if not username:
        raise HTTPException(status_code=400, detail="Username is required.")

    url = f"https://www.facebook.com/{username}"
    headers = {
        "User-Agent": "Mozilla/5.0"  # Helps avoid bot detection
    }

    try:
        response = requests.get(url, headers=headers, timeout=5)
        page_text = response.text.lower()

        # Look for phrases that appear on non-existent profiles
        if ("page isn't available" in page_text or
            "content isn't available" in page_text or
            "not available right now" in page_text or
            "log in to facebook" in page_text and response.status_code == 200):
            return {"username": username, "platform": "facebook", "available": True}
        elif response.status_code == 404:
            return {"username": username, "platform": "facebook", "available": True}
        else:
            return {"username": username, "platform": "facebook", "available": False}

    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Error contacting Facebook: {e}")
@app.post("/check-username/")
def check_username(data: UsernameRequest):
    platform = data.platform.lower()
    username = data.username

    if platform not in PLATFORM_URLS:
        raise HTTPException(status_code=400, detail="Unsupported platform")

    url = PLATFORM_URLS[platform].format(username)

    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            return {"username": username, "platform": platform, "available": False}
        elif response.status_code == 404:
            return {"username": username, "platform": platform, "available": True}
        else:
            return {"username": username, "platform": platform, "available": None, "status_code": response.status_code}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-domains/")
async def generate_domains_endpoint(prompt: Prompt, request: Request):
    samples = RAG(prompt.prompt)
    domains = generate_domains(prompt.prompt, samples)
    domain_names = postprocessing(domains)
    domain_names = extend_domain_names(domain_names)
    domain_names = is_domain_names_available(domain_names)

    sri_lanka_tz = pytz.timezone("Asia/Colombo")
    timestamp = datetime.now(sri_lanka_tz).strftime("%Y-%m-%d %H:%M:%S")
    ip_address = request.client.host

    log_entry = {
        "search_query": prompt.prompt,
        "domain_recommendations": domain_names,
        "ip_address": ip_address,
        "timestamp": timestamp
    }
    return {"domains": domain_names}

@app.post("/details/")
async def get_domain_details(request: DetailRequest):
    if isinstance(request.domain_name, str):
        # Single domain - use await
        result = await domain_details(request.domain_name, request.prompt)
        return result
    else:
        # Multiple domains - process in parallel with error handling
        batch_size = 5
        all_results = []
        
        for i in range(0, len(request.domain_name), batch_size):
            batch = request.domain_name[i:i + batch_size]
            try:
                # Create list of coroutines
                tasks = [domain_details(domain, request.prompt) for domain in batch]
                batch_results = await asyncio.gather(*tasks)
                all_results.extend(batch_results)
            except Exception as e:
                # If batch fails, create error responses for each domain in batch
                error_results = [{
                    "domainName": f"{domain}.lk",
                    "domainDescription": f"Error processing domain: {str(e)}",
                    "relatedFields": []
                } for domain in batch]
                all_results.extend(error_results)
        
        return {"descriptions": all_results}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8001)