import re
import openai
import os
from dotenv import load_dotenv,find_dotenv
from langchain.chains.question_answering import load_qa_chain
import time
import os
from pinecone import Pinecone, ServerlessSpec
from langchain_pinecone import PineconeVectorStore
from langchain_openai import OpenAI, OpenAIEmbeddings


load_dotenv(find_dotenv())
api_key=os.environ.get("OPEN_API_KEY")
llm = OpenAI(api_key=api_key,temperature=0.7)
pine_cone_api_key=os.environ.get("PINE_CONE_API_KEY")

pc = Pinecone(api_key=pine_cone_api_key)
embeddings=OpenAIEmbeddings(openai_api_key=api_key)

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
    instruction = (
        "You are a domain name generator. Based on the user's prompt, generate 10 creative, relevant, and unique domain name ideas "
        "WITHOUT any domain extensions like .com, .net, .io, etc. Just the names only. Present them in a numbered list."
        "Short Domain names are better, Do not combine more than two words for a domain name."
    )

    full_prompt = f"{instruction}\n\nInput:\n{prompt}\n\nResponse:\n"
    
    response = llm(full_prompt)
    return response

def postprocessing(text):
    domain_names = re.findall(r'\d+\.\s+([a-zA-Z0-9]+)', text)
    return domain_names

def final_domains():
    pass

import ast
import multiprocessing
import threading
from concurrent.futures import ThreadPoolExecutor

def domain_details(domain_name: str, prompt: str):
    """Generate details for a single domain name"""
    template = f"""
You are a branding and domain expert. Generate a Python dictionary in the following format. The description should be 50-100 words and it should describe how domain name is suitable for the user requirements:

{{
    "domainName": "{domain_name}.lk",
    "domainDescription": "...",  # a creative description using the prompt
    "relatedFields": [ ... ]     # 4 to 6 relevant fields
}}

Domain name: {domain_name}
Prompt: {prompt}
"""
    
    try:
        response_text = llm.invoke(template)
        # Try to parse the response as a Python dictionary
        result = ast.literal_eval(response_text.strip())
        
        # Ensure the result has the required structure
        if not isinstance(result, dict):
            raise ValueError("Response is not a dictionary")
            
        # Validate required keys
        required_keys = ["domainName", "domainDescription", "relatedFields"]
        if not all(key in result for key in required_keys):
            raise ValueError("Missing required keys in response")
            
        return result
        
    except Exception as e:
        print(f"Error processing domain {domain_name}: {str(e)}")
        # Return a fallback result
        return {
            "domainName": f"{domain_name}.lk",
            "domainDescription": f"A unique domain name '{domain_name}' suitable for your business needs based on: {prompt[:50]}...",
            "relatedFields": ["Business", "Technology", "Innovation", "Digital Services"],
            "error": str(e)
        }

def create_input_list(prompt, name_list):
    """Create input list for multiprocessing"""
    input_list = []
    for name in name_list:
        input_list.append((name, prompt))
    return input_list

def multi_description(prompt, name_list):
    """Generate descriptions for multiple domain names using multiprocessing"""
    if not name_list:
        print("No domain names to process")
        return []
    
    print(f"Processing {len(name_list)} domains: {name_list}")
    
    try:
        input_data = create_input_list(prompt, name_list)
        
        # Use multiprocessing to generate details for all domains
        with multiprocessing.Pool() as pool:
            results = pool.starmap(domain_details, input_data)
        
        print(f"Successfully processed {len(results)} domain details")
        return results
        
    except Exception as e:
        print(f"Error in multi_description: {str(e)}")
        # Fallback: process sequentially if multiprocessing fails
        results = []
        for domain_name in name_list:
            result = domain_details(domain_name, prompt)
            results.append(result)
        return results

def multi_description_threaded(prompt, name_list, max_workers=5):
    """
    Alternative implementation using ThreadPoolExecutor for better integration with FastAPI
    This can be used if multiprocessing causes issues in the threading context
    """
    if not name_list:
        print("No domain names to process")
        return []
    
    print(f"Processing {len(name_list)} domains with threading: {name_list}")
    
    results = []
    try:
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Submit all tasks
            future_to_domain = {
                executor.submit(domain_details, domain_name, prompt): domain_name 
                for domain_name in name_list
            }
            
            # Collect results as they complete
            for future in future_to_domain:
                try:
                    result = future.result(timeout=30)  # 30 second timeout per domain
                    results.append(result)
                except Exception as e:
                    domain_name = future_to_domain[future]
                    print(f"Error processing domain {domain_name}: {str(e)}")
                    # Add fallback result
                    results.append({
                        "domainName": f"{domain_name}.lk",
                        "domainDescription": f"A unique domain name '{domain_name}' suitable for your business needs.",
                        "relatedFields": ["Business", "Technology", "Innovation", "Digital Services"],
                        "error": str(e)
                    })
        
        print(f"Successfully processed {len(results)} domain details with threading")
        return results
        
    except Exception as e:
        print(f"Error in multi_description_threaded: {str(e)}")
        # Final fallback: process sequentially
        results = []
        for domain_name in name_list:
            result = domain_details(domain_name, prompt)
            results.append(result)
        return results