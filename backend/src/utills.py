import re
import os
from dotenv import load_dotenv, find_dotenv
import time
import asyncio
import json
from typing import List, Dict, Callable, Optional
from concurrent.futures import ThreadPoolExecutor
import threading
from pinecone import Pinecone, ServerlessSpec
from langchain_pinecone import PineconeVectorStore
from langchain_openai import OpenAI, OpenAIEmbeddings

load_dotenv(find_dotenv())
api_key = os.environ.get("OPEN_API_KEY")
llm = OpenAI(api_key=api_key, temperature=0.7)
pine_cone_api_key = os.environ.get("PINE_CONE_API_KEY")

# Initialize Pinecone
pc = Pinecone(api_key=pine_cone_api_key)
embeddings = OpenAIEmbeddings(openai_api_key=api_key)

index_name = "dominious"  # change if desired

existing_indexes = [index_info["name"] for index_info in pc.list_indexes()]

if index_name not in existing_indexes:
    pc.create_index(
        name=index_name,
        dimension=1536,
        metric="cosine",
        spec=ServerlessSpec(cloud="aws", region="us-east-1"),
    )
    while not pc.describe_index(index_name).status["ready"]:
        time.sleep(1)

index = pc.Index(index_name)
vector_store = PineconeVectorStore(index=index, embedding=embeddings)

def preprocess():
    pass

def generate_domains(prompt: str) -> str:
    """Generate domain names using LLM"""
    instruction = (
        "You are a domain name generator. Based on the user's prompt, generate only 15 creative, relevant, and unique domain name ideas "
        "WITHOUT any domain extensions like .com, .net, .io, etc. Just the names only. Present them in a numbered list."
        "Short Domain names are better, Do not combine more than two words for a domain name."
    )

    full_prompt = f"{instruction}\n\nInput:\n{prompt}\n\nResponse:\n"
    
    try:
        response = llm(full_prompt)
        return response
    except Exception as e:
        print(f"Error generating domains: {str(e)}")
        # Return fallback domains
        return "1. techstore\n2. shopnow\n3. bizmart\n4. quickbuy\n5. dealzone\n6. tradehub\n7. marketo\n8. sellfast\n9. buyeasy\n10. commerce\n11. webpro\n12. digihub\n13. netzone\n14. onlinemart\n15. cybershop"

def postprocessing(text: str) -> List[str]:
    """Extract domain names from LLM response - updated to handle up to 15 domains"""
    try:
        # Primary pattern: numbered list
        domain_names = re.findall(r'\d+\.\s+([a-zA-Z0-9]+)', text)
        
        # If no matches, try alternative patterns
        if not domain_names:
            # Try pattern with dashes or underscores
            domain_names = re.findall(r'\d+\.\s+([a-zA-Z0-9\-_]+)', text)
        
        # If still no matches, try extracting any word-like strings
        if not domain_names:
            lines = text.split('\n')
            for line in lines:
                if re.match(r'\d+\.', line.strip()):
                    # Extract everything after the number and dot, clean it up
                    domain = re.sub(r'^\d+\.\s*', '', line.strip())
                    domain = re.sub(r'[^a-zA-Z0-9]', '', domain)
                    if domain and len(domain) > 2:
                        domain_names.append(domain)
        
        # Clean and validate domains
        cleaned_domains = []
        for domain in domain_names:
            # Remove any non-alphanumeric characters
            clean_domain = re.sub(r'[^a-zA-Z0-9]', '', domain.lower())
            # Check if domain is reasonable length
            if 3 <= len(clean_domain) <= 20:
                cleaned_domains.append(clean_domain)
        
        return cleaned_domains[:15]  # Return max 15 domains
        
    except Exception as e:
        print(f"Error in postprocessing: {str(e)}")
        return []

def parse_llm_response(response_text: str) -> Dict:
    """Safely parse LLM response with multiple fallback methods"""
    # Clean the response text
    response_text = response_text.strip()
    
    # Method 1: Try ast.literal_eval
    try:
        import ast
        result = ast.literal_eval(response_text)
        if isinstance(result, dict) and all(key in result for key in ["domainName", "domainDescription", "relatedFields"]):
            return result
    except:
        pass
    
    # Method 2: Try json.loads
    try:
        result = json.loads(response_text)
        if isinstance(result, dict) and all(key in result for key in ["domainName", "domainDescription", "relatedFields"]):
            return result
    except:
        pass
    
    # Method 3: Try to fix common JSON issues and parse again
    try:
        # Fix common issues
        fixed_text = response_text.replace("'", '"')  # Replace single quotes with double quotes
        fixed_text = re.sub(r'(\w+):', r'"\1":', fixed_text)  # Add quotes around keys
        fixed_text = re.sub(r':\s*([a-zA-Z][^,\]}\n]*)', r': "\1"', fixed_text)  # Add quotes around string values
        
        result = json.loads(fixed_text)
        if isinstance(result, dict):
            return result
    except:
        pass
    
    # Method 4: Extract information using regex (fallback)
    try:
        domain_name_match = re.search(r'"?domainName"?\s*:\s*"?([^",\n]+)"?', response_text, re.IGNORECASE)
        description_match = re.search(r'"?domainDescription"?\s*:\s*"?([^",\n]+)"?', response_text, re.IGNORECASE)
        fields_match = re.search(r'"?relatedFields"?\s*:\s*\[([^\]]+)\]', response_text, re.IGNORECASE)
        
        domain_name = domain_name_match.group(1).strip().strip('"') if domain_name_match else "Unknown"
        description = description_match.group(1).strip().strip('"') if description_match else "No description available"
        
        if fields_match:
            fields_text = fields_match.group(1)
            fields = [field.strip().strip('"').strip("'") for field in fields_text.split(',')]
        else:
            fields = ["Business", "Technology", "Innovation", "Digital Services"]
        
        return {
            "domainName": domain_name,
            "domainDescription": description,
            "relatedFields": fields
        }
    except Exception as e:
        print(f"All parsing methods failed: {str(e)}")
        return None

def domain_details(domain_name: str, prompt: str) -> Dict:
    """Generate details for a single domain name with improved error handling"""
    template = f"""
Generate a JSON object for a domain name. Respond ONLY with valid JSON in this exact format:

{{
    "domainName": "{domain_name}.lk",
    "domainDescription": "A 50-100 word description of how this domain name suits the user requirements",
    "relatedFields": ["field1", "field2", "field3", "field4"]
}}

Domain name: {domain_name}
User requirements: {prompt}

Response (JSON only):
"""
    
    max_retries = 3
    for attempt in range(max_retries):
        try:
            response_text = llm.invoke(template)
            result = parse_llm_response(response_text)
            
            if result:
                # Ensure the domain name has .lk extension
                if not result["domainName"].endswith(".lk"):
                    result["domainName"] = f"{domain_name}.lk"
                return result
            else:
                print(f"Failed to parse response for {domain_name}, attempt {attempt + 1}")
                
        except Exception as e:
            print(f"Error processing domain {domain_name}, attempt {attempt + 1}: {str(e)}")
            
        # Wait before retry
        if attempt < max_retries - 1:
            time.sleep(1)
    
    # Return fallback result if all attempts fail
    return {
        "domainName": f"{domain_name}.lk",
        "domainDescription": f"A unique domain name '{domain_name}' suitable for your business needs based on: {prompt[:100]}{'...' if len(prompt) > 100 else ''}",
        "relatedFields": ["Business", "Technology", "Innovation", "Digital Services"],
        "error": "Failed to generate detailed description after multiple attempts"
    }

async def domain_details_async(domain_name: str, prompt: str) -> Dict:
    """Async wrapper for domain_details"""
    loop = asyncio.get_event_loop()
    with ThreadPoolExecutor(max_workers=1) as executor:
        result = await loop.run_in_executor(executor, domain_details, domain_name, prompt)
    return result

async def multi_description_async(
    prompt: str, 
    name_list: List[str], 
    progress_callback: Optional[Callable[[int, int, Optional[Dict]], None]] = None,
    max_concurrent: int = 5  # Increased concurrency for faster processing
) -> List[Dict]:
    """
    Generate descriptions for multiple domain names using async processing with real-time updates
    Enhanced to call progress_callback with individual results as they complete
    """
    if not name_list:
        print("No domain names to process")
        return []
    
    print(f"Processing {len(name_list)} domains: {name_list}")
    
    results = []
    processed_count = 0
    results_lock = asyncio.Lock()
    
    # Create semaphore to limit concurrent requests
    semaphore = asyncio.Semaphore(max_concurrent)
    
    async def process_single_domain(domain_name: str, index: int) -> Dict:
        nonlocal processed_count
        async with semaphore:
            try:
                result = await domain_details_async(domain_name, prompt)
                
                async with results_lock:
                    processed_count += 1
                    
                    # Call progress callback with the completed result
                    if progress_callback:
                        await asyncio.get_event_loop().run_in_executor(
                            None, 
                            progress_callback, 
                            processed_count, 
                            len(name_list), 
                            result
                        )
                
                print(f"Completed {processed_count}/{len(name_list)}: {domain_name}")
                return result
                
            except Exception as e:
                print(f"Error processing {domain_name}: {str(e)}")
                
                async with results_lock:
                    processed_count += 1
                
                fallback_result = {
                    "domainName": f"{domain_name}.lk",
                    "domainDescription": f"A domain name for {domain_name} related to: {prompt[:50]}...",
                    "relatedFields": ["Business", "Technology", "Innovation", "Digital Services"],
                    "error": str(e)
                }
                
                # Call progress callback even for errors
                if progress_callback:
                    await asyncio.get_event_loop().run_in_executor(
                        None, 
                        progress_callback, 
                        processed_count, 
                        len(name_list), 
                        fallback_result
                    )
                
                return fallback_result
    
    try:
        # Process all domains concurrently with semaphore limiting
        tasks = [process_single_domain(domain_name, i) for i, domain_name in enumerate(name_list)]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Handle any exceptions in results
        final_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                print(f"Exception for domain {name_list[i]}: {str(result)}")
                fallback_result = {
                    "domainName": f"{name_list[i]}.lk",
                    "domainDescription": f"A domain name for {name_list[i]} related to: {prompt[:50]}...",
                    "relatedFields": ["Business", "Technology", "Innovation", "Digital Services"],
                    "error": str(result)
                }
                final_results.append(fallback_result)
            else:
                final_results.append(result)
        
        print(f"Successfully processed {len(final_results)} domain details")
        return final_results
        
    except Exception as e:
        print(f"Error in multi_description_async: {str(e)}")
        # Fallback: return basic results for all domains
        fallback_results = []
        for domain_name in name_list:
            fallback_result = {
                "domainName": f"{domain_name}.lk",
                "domainDescription": f"A domain name for {domain_name} related to: {prompt[:50]}...",
                "relatedFields": ["Business", "Technology", "Innovation", "Digital Services"],
                "error": f"Processing failed: {str(e)}"
            }
            fallback_results.append(fallback_result)
            
            # Call progress callback for each fallback result
            if progress_callback:
                try:
                    progress_callback(len(fallback_results), len(name_list), fallback_result)
                except Exception as callback_error:
                    print(f"Error in progress callback: {callback_error}")
        
        return fallback_results

# Legacy function for backward compatibility
def multi_description(prompt: str, name_list: List[str]) -> List[Dict]:
    """Legacy synchronous version - runs the async version in a new event loop"""
    try:
        # Create new event loop for this function
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            return loop.run_until_complete(multi_description_async(prompt, name_list))
        finally:
            loop.close()
    except Exception as e:
        print(f"Error in multi_description: {str(e)}")
        # Fallback to sequential processing
        results = []
        for domain_name in name_list:
            result = domain_details(domain_name, prompt)
            results.append(result)
        return results

def final_domains():
    pass

# Cleanup functions for better resource management
def cleanup_resources():
    """Clean up resources if needed"""
    pass

# Health check function
def health_check() -> bool:
    """Check if all services are working"""
    try:
        # Test OpenAI connection
        test_response = llm.invoke("Test")
        
        # Test Pinecone connection
        pc.list_indexes()
        
        return True
    except Exception as e:
        print(f"Health check failed: {str(e)}")
        return False

# Additional utility functions for real-time updates
async def process_domains_with_streaming(
    prompt: str, 
    domain_names: List[str],
    callback: Callable[[str, Dict], None]
) -> List[Dict]:
    """
    Process domains with streaming results - calls callback for each completed domain
    """
    async def stream_callback(processed: int, total: int, latest_result: Dict = None):
        if latest_result and callback:
            domain_name = latest_result['domainName'].replace('.lk', '')
            callback(domain_name, latest_result)
    
    return await multi_description_async(prompt, domain_names, stream_callback)

def batch_process_domains(domain_names: List[str], prompt: str, batch_size: int = 3) -> List[Dict]:
    """
    Process domains in batches for memory efficiency
    """
    results = []
    
    for i in range(0, len(domain_names), batch_size):
        batch = domain_names[i:i + batch_size]
        print(f"Processing batch {i//batch_size + 1}: {batch}")
        
        # Process batch synchronously
        batch_results = []
        for domain_name in batch:
            result = domain_details(domain_name, prompt)
            batch_results.append(result)
            time.sleep(0.1)  # Small delay to prevent rate limiting
        
        results.extend(batch_results)
    
    return results