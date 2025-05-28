import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv('GROQ_API_KEY')
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

def analyze_with_groq(content, question):
    """
    Analyze product content and answer user questions using Groq API
    """
    try:
        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        
        system_prompt = """You are an expert e-commerce product advisor and analyst. You help users make informed purchasing decisions by analyzing product information, reviews, and specifications.

Your capabilities include:
- Analyzing product features and specifications
- Interpreting customer reviews and ratings
- Providing personalized recommendations based on user needs
- Comparing products and highlighting pros/cons
- Answering questions about suitability, quality, and value

Always provide helpful, accurate, and honest advice. If you don't have enough information, say so clearly. Be conversational but professional."""

        user_prompt = f"""
Product Information:
{content}

User Question: {question}

Please provide a helpful and detailed response based on the product information above. If the user is asking about suitability (like skin type, usage, etc.), provide specific advice based on the product details and reviews available.
"""

        payload = {
            "model": "llama3-70b-8192",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.7,
            "max_tokens": 1000
        }

        response = requests.post(GROQ_API_URL, headers=headers, json=payload)
        
        if response.status_code == 200:
            result = response.json()
            return result["choices"][0]["message"]["content"]
        else:
            return f"Sorry, I encountered an error analyzing the product. Please try again later."
            
    except Exception as e:
        print(f"Error with Groq API: {e}")
        return "I'm having trouble processing your request right now. Please try again in a moment."

def generate_product_summary(content):
    """
    Generate a concise product summary
    """
    summary_prompt = f"""
Based on the following product information, provide a brief 2-3 sentence summary highlighting the key features and benefits:

{content}
"""
    
    return analyze_with_groq(content, summary_prompt)
