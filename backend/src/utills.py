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

def generate_domains(prompt):
    return '''Input:
Looking for a unique domain name for financial management tool? 

Response:

1. FinanceFly.com
2. MoneyMind.net
3. WealthWise.org
4. CashClever.io
5. EconoSavvy.com
6. FiscalFriend.net
7. ProsperityPath.org
8. InvestInsight.io
9. BudgetBoss.com
10. CashCraft.net'''
def postprocessing(text):
    domain_names = re.findall(r'\d+\.\s+([a-zA-Z0-9]+)\.[a-z]+', text)
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