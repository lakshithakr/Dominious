import re


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
def domain_details(domain_name):
    return {
        'domainName': domain_name+'.lk',
        'domainDescription': [
            f"FinanceFly is a dynamic and innovative financial management platform designed to help individuals and businesses take control of their financial future.",
            "The name combines 'Finance' with 'Fly,' symbolizing the ability to elevate financial operations to new heights with speed and precision. Whether it's streamlining daily budgeting, tracking expenses, or making informed investment decisions, FinanceFly aims to provide users with a seamless and intuitive experience.",
            "With a focus on user-friendly design and cutting-edge technology, FinanceFly empowers users to make smarter financial choices, optimize their wealth, and achieve their goals faster."
        ],
        'relatedFields': [
            "Personal Finance Management",
            "Budgeting Tools",
            "Financial Planning & Advisory",
            "Expense Tracking Solutions",
            "Investment & Portfolio Management"
        ]
    }