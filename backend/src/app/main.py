from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import threading
import uuid
from src.utills import generate_domains, postprocessing, domain_details, multi_description, multi_description_threaded

# Global dictionary to store background task results
background_results = {}

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

def background_domain_details_task(task_id: str, prompt: str, domain_names: list):
    """Background task to generate domain details"""
    try:
        print(f"Starting background task {task_id} for {len(domain_names)} domains")
        domain_details_list = multi_description_threaded(prompt, domain_names)
        background_results[task_id] = {
            "status": "completed",
            "data": domain_details_list,
            "error": None
        }
        print(f"Background task {task_id} completed successfully")
    except Exception as e:
        print(f"Background task {task_id} failed: {str(e)}")
        background_results[task_id] = {
            "status": "failed",
            "data": None,
            "error": str(e)
        }

@app.post("/generate-domains/")
async def generate_domains_endpoint(prompt: Prompt):
    # Generate domains using LLM
    domains = generate_domains(prompt.prompt)
    print("Raw domains:", domains)
    
    # Post-process to extract clean domain names
    domain_names = postprocessing(domains)
    print("Processed domain names:", domain_names)
    
    # Generate unique task ID for this request
    task_id = str(uuid.uuid4())
    
    # Initialize task status
    background_results[task_id] = {
        "status": "processing",
        "data": None,
        "error": None
    }
    
    # Start background thread to generate domain details
    thread = threading.Thread(
        target=background_domain_details_task,
        args=(task_id, prompt.prompt, domain_names)
    )
    thread.daemon = True  # Thread will die when main program exits
    thread.start()
    
    return {
        "domains": domain_names,
        "task_id": task_id,
        "message": "Domain details are being generated in the background. Use the task_id to check status."
    }

@app.get("/task-status/{task_id}")
async def get_task_status(task_id: str):
    """Check the status of a background task"""
    if task_id not in background_results:
        return {"error": "Task ID not found"}
    
    result = background_results[task_id]
    
    if result["status"] == "completed":
        # Clean up completed task from memory after returning result
        data = result["data"]
        del background_results[task_id]
        return {
            "status": "completed",
            "domain_details": data
        }
    elif result["status"] == "failed":
        error = result["error"]
        del background_results[task_id]
        return {
            "status": "failed",
            "error": error
        }
    else:
        return {
            "status": "processing",
            "message": "Domain details are still being generated..."
        }

@app.post("/details/")
async def get_domain_details(request: DetailRequest):
    dd = domain_details(request.domain_name, request.prompt)
    return dd

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)