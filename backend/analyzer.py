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

Your answer must follow this style:
- Structured using bullet points or numbered lists (if applicable)
- Keep answers direct and well-structured.
- Highlight pros/cons.
- Use Bullet points (•) 
- If comparing specs, use tables (in markdown).
- Be short and precise (no long paragraphs)
- Use **bold** for key terms
- Use emojis (✅, ❌, 🔍, etc.) sparingly for visual clarity
- Avoid repeating product info, focus on summarizing and insights
- If unsure, say "Not enough information"

Always provide helpful, honest, and concise advice in a user-friendly tone. Use Markdown for formatting.
"""

        user_prompt = f"""
### Product Info:
{content}

### User Question:
{question}

📌 Please give your answer in a clear, short, structured format with bullet points and Markdown (bold keywords, use ✅/❌ if needed). Avoid long paragraphs.
"""

        payload = {
            "model": "llama3-70b-8192",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.6,
            "max_tokens": 1000
        }

        response = requests.post(GROQ_API_URL, headers=headers, json=payload)
        
        if response.status_code == 200:
            result = response.json()
            return result["choices"][0]["message"]["content"]
        else:
            return "❌ Sorry, I couldn't analyze the product right now. Try again later."
            
    except Exception as e:
        print(f"Error with Groq API: {e}")
        return "⚠️ I'm having trouble processing your request. Please try again shortly."

def generate_product_summary(content):
    """
    Generate a concise product summary
    """
    summary_prompt = f"""
Based on the following product information, provide a brief 2-3 sentence summary highlighting the key features and benefits:

{content}
"""
    
    return analyze_with_groq(content, summary_prompt)
