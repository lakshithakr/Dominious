from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uuid
import asyncio
from datetime import datetime
from typing import Dict, List, Optional
from src.utills import generate_domains, postprocessing, domain_details, multi_description_async
import pkg_resources
from symspellpy import SymSpell

# Global dictionary to store background task results with enhanced structure
background_results: Dict[str, Dict] = {}

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

class TaskStatus(BaseModel):
    task_id: str
    status: str  # "pending", "processing", "completed", "failed"
    progress: int  # 0-100
    created_at: str
    completed_at: Optional[str] = None
    total_domains: int = 0
    processed_domains: int = 0

async def background_domain_details_task(task_id: str, prompt: str, domain_names: List[str]):
    """Enhanced background task to generate domain details with progress tracking"""
    try:
        print(f"Starting background task {task_id} for {len(domain_names)} domains")
        
        # Update task status to processing
        background_results[task_id].update({
            "status": "processing",
            "progress": 0,
            "total_domains": len(domain_names),
            "processed_domains": 0
        })
        
        # Generate domain details using async implementation
        domain_details_list = await multi_description_async(
            prompt, 
            domain_names, 
            progress_callback=lambda processed, total: update_task_progress(task_id, processed, total)
        )
        
        # Update final results
        background_results[task_id].update({
            "status": "completed",
            "data": domain_details_list,
            "error": None,
            "progress": 100,
            "processed_domains": len(domain_names),
            "completed_at": datetime.now().isoformat()
        })
        
        print(f"Background task {task_id} completed successfully")
        
    except Exception as e:
        print(f"Background task {task_id} failed: {str(e)}")
        background_results[task_id].update({
            "status": "failed",
            "data": None,
            "error": str(e),
            "completed_at": datetime.now().isoformat()
        })

def update_task_progress(task_id: str, processed: int, total: int):
    """Update task progress"""
    if task_id in background_results:
        progress = int((processed / total) * 100) if total > 0 else 0
        background_results[task_id].update({
            "progress": progress,
            "processed_domains": processed
        })

@app.post("/generate-domains/")
async def generate_domains_endpoint(prompt: Prompt, background_tasks: BackgroundTasks):
    try:
        # Setup SymSpell
        sym_spell = SymSpell(max_dictionary_edit_distance=2, prefix_length=7)

        # Load a frequency dictionary
        dictionary_path = pkg_resources.resource_filename(
            "symspellpy", "frequency_dictionary_en_82_765.txt"
        )
        sym_spell.load_dictionary(dictionary_path, term_index=0, count_index=1)

        sentence_suggestions = sym_spell.lookup_compound(
            prompt.prompt, 
            max_edit_distance=2,
            transfer_casing=True  # Preserves original capitalization
        )

        if sentence_suggestions:
            corrected_prompt = sentence_suggestions[0].term
        else:
            corrected_prompt = prompt.prompt

        print(f"Original prompt: {prompt.prompt}")
        print(f"Corrected prompt: {corrected_prompt}")

        # Generate domains using LLM
        domains = generate_domains(corrected_prompt.lower())
        print("Raw domains:", domains)
        
        # Post-process to extract clean domain names
        domain_names = postprocessing(domains)
        print("Processed domain names:", domain_names)
        
        if not domain_names:
            return {
                "error": "No valid domain names could be generated from the prompt",
                "domains": [],
                "task_id": None
            }
        
        # Generate unique task ID for this request
        task_id = str(uuid.uuid4())
        
        # Initialize task status with enhanced tracking
        background_results[task_id] = {
            "status": "pending",
            "data": None,
            "error": None,
            "progress": 0,
            "created_at": datetime.now().isoformat(),
            "total_domains": len(domain_names),
            "processed_domains": 0,
            "domains": domain_names,
            "original_prompt": prompt.prompt
        }
        
        # Start background task using FastAPI's background tasks
        background_tasks.add_task(
            background_domain_details_task,
            task_id,
            prompt.prompt,
            domain_names
        )
        
        return {
            "domains": domain_names,
            "task_id": task_id,
            "message": "Domain details are being generated in the background. Use the task_id to check status.",
            "total_domains": len(domain_names)
        }
        
    except Exception as e:
        print(f"Error in generate_domains_endpoint: {str(e)}")
        return {
            "error": f"Failed to generate domains: {str(e)}",
            "domains": [],
            "task_id": None
        }

@app.get("/task-status/{task_id}", response_model=TaskStatus)
async def get_task_status(task_id: str):
    """Get detailed status of a background task"""
    if task_id not in background_results:
        return TaskStatus(
            task_id=task_id,
            status="not_found",
            progress=0,
            created_at="",
            total_domains=0,
            processed_domains=0
        )
    
    result = background_results[task_id]
    
    return TaskStatus(
        task_id=task_id,
        status=result["status"],
        progress=result.get("progress", 0),
        created_at=result["created_at"],
        completed_at=result.get("completed_at"),
        total_domains=result.get("total_domains", 0),
        processed_domains=result.get("processed_domains", 0)
    )

@app.get("/domain-details/{task_id}")
async def get_domain_details(task_id: str):
    """Get generated domain details for a completed task"""
    if task_id not in background_results:
        return {"error": "Task ID not found"}
    
    result = background_results[task_id]
    
    if result["status"] == "completed":
        # Return data but keep in memory for potential re-requests
        return {
            "status": "completed",
            "task_id": task_id,
            "domain_details": result["data"],
            "total_domains": result.get("total_domains", 0),
            "processed_domains": result.get("processed_domains", 0)
        }
    elif result["status"] == "failed":
        return {
            "status": "failed",
            "task_id": task_id,
            "error": result["error"]
        }
    else:
        return {
            "status": result["status"],
            "task_id": task_id,
            "progress": result.get("progress", 0),
            "message": "Domain details are still being generated...",
            "processed_domains": result.get("processed_domains", 0),
            "total_domains": result.get("total_domains", 0)
        }

@app.delete("/task/{task_id}")
async def cleanup_task(task_id: str):
    """Clean up a completed task from memory"""
    if task_id in background_results:
        del background_results[task_id]
        return {"message": f"Task {task_id} cleaned up successfully"}
    return {"error": "Task not found"}

@app.get("/active-tasks")
async def get_active_tasks():
    """Get list of all active tasks (for debugging)"""
    active_tasks = []
    for task_id, result in background_results.items():
        active_tasks.append({
            "task_id": task_id,
            "status": result["status"],
            "progress": result.get("progress", 0),
            "created_at": result["created_at"],
            "total_domains": result.get("total_domains", 0)
        })
    return {"active_tasks": active_tasks}

@app.post("/details/")
async def get_single_domain_details(request: DetailRequest):
    """Generate details for a single domain name (synchronous)"""
    try:
        dd = domain_details(request.domain_name, request.prompt)
        return dd
    except Exception as e:
        return {
            "error": f"Failed to generate details for {request.domain_name}: {str(e)}",
            "domainName": f"{request.domain_name}.lk",
            "domainDescription": f"A domain name for {request.domain_name} related to: {request.prompt}",
            "relatedFields": ["Business", "Technology", "Innovation", "Digital Services"]
        }

@app.get("/")
async def root():
    return {
        "message": "Domain Generator API",
        "version": "2.0",
        "features": [
            "Domain name generation",
            "Background description processing",
            "Progress tracking",
            "Error handling"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)