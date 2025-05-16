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
    return domain_names


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