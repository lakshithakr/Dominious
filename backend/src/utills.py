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


with open("names.txt", "r") as file:
    retrived_domain_names_list = [line.strip() for line in file]
domain_name_set = set(retrived_domain_names_list)

def get_adjusted_first_syllable(word):
    """Split a word into syllables and return the adjusted first syllable."""
    word = word.lower()
    pattern = r'[^aeiouy]*[aeiouy]+(?:[^aeiouy]*$|[^aeiouy](?=[^aeiouy]))?'
    syllables = re.findall(pattern, word)
    if not syllables:
        return word
    if len(syllables) == 1:
        return syllables[0]
    
    first, next_syl = syllables[0], syllables[1]
    vowels = "aeiouy"

    if len(first) > 2:
        if next_syl[0] in vowels or next_syl[0] == first[-1]:
            first += next_syl[0]
    else:
        if first[-1] == next_syl[0]:
            first += next_syl[0]
        else:
            for ch in next_syl:
                first += ch
                if ch in vowels:
                    break
    return first

def extend_domain_names(domain_list, max_part_len=6, min_domain_len=9):
    """
    Extend domain names:
    - Only create a shortened variant if the full name > min_domain_len
      AND any part > max_part_len.
    - Shorten long parts using get_adjusted_first_syllable.
    - Keep original names and add new ones.
    - Sort the final list by length.
    """
    extended = domain_list.copy()
    for name in domain_list:
        parts = re.findall(r'[A-Z]?[a-z]+', name)
        if len(parts)>1:
            # Check conditions: full name length & long part
            if len(name) <= min_domain_len or not any(len(p) > max_part_len for p in parts):
                continue  # Skip adding shortened variant

            new_parts = []
            for part in parts:
                if len(part) > max_part_len:
                    new_parts.append(get_adjusted_first_syllable(part))
                else:
                    new_parts.append(part.lower())
            new_name = "".join(p.capitalize() for p in new_parts)
            if new_name not in extended:
                extended.append(new_name)

    # Sort by length (shortest to longest)
    extended.sort(key=len)
    print(extended)
    return extended


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
    domain_names=list(set(domain_names))
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

async def domain_details(domain_name: str, prompt: str):
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
    
    try:
        # Use the correct async method based on your LLM client
        if hasattr(llm, 'ainvoke'):
            response = await llm.ainvoke(template)
        elif hasattr(llm, 'apredict'):
            response = await llm.apredict(template)
        else:
            # Fallback to synchronous if async not available
            response = llm.invoke(template)
        
        # Handle both string and object responses
        response_text = response if isinstance(response, str) else str(response)
        result = ast.literal_eval(response_text)
        print(result)
        return result
    except Exception as e:
        return {
            "domainName": f"{domain_name}.lk",
            "domainDescription": f"Failed to generate description: {str(e)}",
            "relatedFields": []
        }


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
        You are a branding and domain expert.Generate a Python dictionary in the following format. The domain description should 200-300 words and it should describe how domain name suitable for the user requirements. Please follow the output format given bellow, you should follow the template:
        Domain name: {domain_name}
        Prompt: {prompt}
        {{
            "domainName": "{domain_name}",
            "domainDescription": "...",  # a creative description using the prompt
            "relatedFields": [ ... ]     # 4 to 6 relevant fields
        }}

        output:
    """
    payload = {
        "inputs": template,
        "parameters": {
            "max_new_tokens": 300,
            "temperature": 0.8,
            "top_k": 50,
        }
    }
    response = requests.post(API_URL, headers=headers, json=payload)
    llm_response=response.json()
    return llm_response[0]['generated_text'],domain_name

def gemma_preprocess(llm_output,domain_name):
    print(llm_output)
    print(type(llm_output))
    print(llm_output[-1])
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
            "domainName": f"{domain_name}",
            "domainDescription": "Failed to parse response from LLM.",
            "relatedFields": []
        }
    

def is_domain_names_available(generated_name_list):
    available_name_list = []
    for name in generated_name_list:
        temp = name.lower().split(".")[0]
        if temp not in domain_name_set:
            available_name_list.append(name)
    return available_name_list
    

