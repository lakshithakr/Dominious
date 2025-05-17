import re
import openai
import os
from dotenv import load_dotenv,find_dotenv
from langchain.llms import OpenAI
from langchain.chains.question_answering import load_qa_chain
import time
import os
from pinecone import Pinecone, ServerlessSpec
from langchain_pinecone import PineconeVectorStore
from langchain.embeddings.openai import OpenAIEmbeddings
import requests
import json

load_dotenv(find_dotenv())
api_key=os.environ.get("OPEN_API_KEY")
llm = OpenAI(api_key=api_key,temperature=0.7)
pine_cone_api_key=os.environ.get("PINE_CONE_API_KEY")
HF_API_KEY = os.environ.get("HF_API_KEY")
pc = Pinecone(api_key=pine_cone_api_key)

embeddings=OpenAIEmbeddings(openai_api_key=api_key)
index_name = "dominious"  # change if desired
existing_indexes = [index_info["name"] for index_info in pc.list_indexes()]

API_URL = "https://t7cpt5aki2ddo8ox.us-east-1.aws.endpoints.huggingface.cloud"
headers = {
    "Accept": "application/json",
    "Authorization": f"Bearer {HF_API_KEY}",
    "Content-Type": "application/json"
}




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


def RAG(user_query):
    results = vector_store.similarity_search(query=user_query,k=20)
    categories = []
    domain_names = []

    for doc in results:
        # Save the category
        categories.append(doc.metadata['category'])

        # Get the raw domain_names field
        raw = doc.metadata['domain_names']

        # Join into one string (if it's a broken list of strings)
        combined = ' '.join(raw)

        # Use regex to find words (filter out extra characters)
        names = re.findall(r"[A-Za-z][A-Za-z0-9]+", combined)

        # Append as a sublist
        domain_names.append(names)

    domain_names = [item for sublist in domain_names for item in sublist]
    short=domain_names[:15]
    result = ','.join(short)
    return result

def preprocess():
    pass

def generate_domains(user_description: str, sample_domains: str) -> str:
    prompt = f"""
        You are an expert domain name generator. Your task is to create domain name suggestions that closely match the user's input and follow the style and pattern of the sample domain names provided.

        User Input Description:
        "{user_description}"

        Sample Domain Names:
        {sample_domains}

        Instructions:
        - Generate 10 to 15 domain names that fit the user's input description.
        - The names should be short, easy to understand, creative, memorable, and relevant to the input.
        - Use similar word structures and language style as the samples.
        - Avoid overly long or complicated names; keep them concise and simple.
        - Do not repeat exact sample names.
        - Provide only the domain name suggestions without any domain extensions (like .com, .net, .lk).
        - Provide the domain names in a numbered list .

        Suggested Domain Names:
"""
    
    response = llm(prompt)
    # print(response)
    return response
def postprocessing(text):
    domain_names = re.findall(r'\d+\.\s+([a-zA-Z0-9]+)', text)
    return domain_names
def final_domains():
    pass


import ast

def domain_details(domain_name: str, prompt: str):
    template = f"""
You are a branding and domain expert.Generate a Python dictionary in the following format. The description should 50-100 words and it should describe how domain name suitable for the user requirements:

{{
    "domainName": "{domain_name}.lk",
    "domainDescription": "...",  # a creative description using the prompt
    "relatedFields": [ ... ]     # 4 to 6 relevant fields
}}

Domain name: {domain_name}
Prompt: {prompt}
"""
    
    response_text = llm.invoke(template)  # ✅ use .invoke() instead of calling directly

    #print(type(response_text))  # should be <class 'str'> if it’s a string

    try:
        result = ast.literal_eval(response_text)
    except Exception as e:
        result = {
            "domainName": f"{domain_name}.lk",
            "domainDescription": "Failed to parse response from LLM.",
            "relatedFields": [],
            "error": str(e)
        }

    return result  # ✅ This is a dict now


def gemma(user_description: str, sample_domains: str) -> str:
    input_text=f"""
        You are an expert domain name generator. Your task is to create domain name suggestions that closely match the user's input and follow the style and pattern of the sample domain names provided.

        User Input Description:
        "{user_description}"

        Sample Domain Names:
        {sample_domains}

        Instructions:
        - Generate 10 to 15 domain names that fit the user's input description.
        - The names should be short, easy to understand, creative, memorable, and relevant to the input.
        - Use similar word structures and language style as the samples.
        - Avoid overly long or complicated names; keep them concise and simple.
        - Do not repeat exact sample names.
        - Provide only the domain name suggestions without any domain extensions (like .com, .net, .lk).
        - Provide the domain names in a numbered list .

        Suggested Domain Names:
"""
    payload = {
        "inputs": input_text,
        "parameters": {
            "max_new_tokens": 100,
            "temperature": 0.8,
            "top_k": 50,
        }
    }
    response = requests.post(API_URL, headers=headers, json=payload)
    #print(response.json())
    return response.json()

def gemma_post_processing(output):
    text = output[0]['generated_text']
    suggested_text = text.split("Suggested Domain Names:")[-1]
    domain_names = re.findall(r'\d+\.\s*([A-Za-z0-9]+)', suggested_text)
    domain_names = list(dict.fromkeys(domain_names))
    return domain_names


def gemma_decsription(domain_name: str, prompt: str):
    template = f"""
        You are a branding and domain expert.Generate a Python dictionary in the following format. The description should 50-100 words and it should describe how domain name suitable for the user requirements:
        Domain name: {domain_name}
        Prompt: {prompt}
        {{
            "domainName": "{domain_name}.lk",
            "domainDescription": "...",  # a creative description using the prompt
            "relatedFields": [ ... ]     # 4 to 6 relevant fields
        }}

        output:
    """
    payload = {
        "inputs": template,
        "parameters": {
            "max_new_tokens": 100,
            "temperature": 0.8,
            "top_k": 50,
        }
    }
    response = requests.post(API_URL, headers=headers, json=payload)
    llm_response=response.json()
    return llm_response[0]['generated_text'],domain_name

def gemma_preprocess(llm_output,domain_name):
    try:
        # Try to find a code block with ```json or ```python
        code_block_match = re.search(r'```(?:json|python)?\s*(\{[\s\S]*?\})\s*```', llm_output, re.IGNORECASE)

        if code_block_match:
            json_string = code_block_match.group(1)
        else:
            # Fallback: try to find the last JSON-like block in the output
            all_matches = re.findall(r'\{[\s\S]*?\}', llm_output)
            if not all_matches:
                raise ValueError("No JSON object found.")
            json_string = all_matches[-1]  # Use the last one assuming it's the actual output

        # Try to parse the JSON
        parsed_json = json.loads(json_string)
        return parsed_json

    except Exception:
        return {
            "domainName": f"{domain_name}.lk",
            "domainDescription": "Failed to parse response from LLM.",
            "relatedFields": []
        }
