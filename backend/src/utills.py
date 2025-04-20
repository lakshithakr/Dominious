import re
import openai
import os
from dotenv import load_dotenv,find_dotenv
from langchain.llms import OpenAI
from langchain.chains.question_answering import load_qa_chain
load_dotenv(find_dotenv())
api_key=os.environ.get("OPEN_API_KEY")
llm = OpenAI(api_key=api_key,temperature=0.7)


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