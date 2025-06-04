from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from scraper import scrape_website, extract_body_content, clean_body_content
from analyzer import analyze_with_groq

app = Flask(__name__)
CORS(app)

analyzed_content = {}

@app.route('/analyze', methods=['POST'])
def analyze_page():
    try:
        data = request.json
        url = data.get('url')
        
        if not url:
            return jsonify({'error': 'URL is required'}), 400
        
        print(f"Scraping URL: {url}")
        
 
        html_content = scrape_website(url)
        body_content = extract_body_content(html_content)
        cleaned_content = clean_body_content(body_content)
        

        analyzed_content[url] = cleaned_content
        
        return jsonify({
            'success': True,
            'content': cleaned_content[:1000] + '...' if len(cleaned_content) > 1000 else cleaned_content,
            'message': 'Page analyzed successfully'
        })
        
    except Exception as e:
        print(f"Analysis error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        message = data.get('message')
        url = data.get('url')
        
        if not message:
            return jsonify({'error': 'Message is required'}), 400
        

        context = analyzed_content.get(url, '')
        
        if not context:

            try:
                html_content = scrape_website(url)
                body_content = extract_body_content(html_content)
                context = clean_body_content(body_content)
                analyzed_content[url] = context
            except:
                context = "Limited product information available."
        

        response = analyze_with_groq(context, message)
        
        return jsonify({
            'success': True,
            'reply': response
        })
        
    except Exception as e:
        print(f"Chat error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
