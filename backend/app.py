from flask import Flask, request, jsonify
from flask_cors import CORS
from scraper import scrape_website, extract_body_content, clean_body_content
from analyzer import analyze_with_groq

app = Flask(__name__)
CORS(app)

# Cache for product content
analyzed_content = {}

@app.route('/analyze', methods=['POST'])
def analyze_page():
    try:
        url = request.json.get('url')
        if not url:
            return jsonify({'error': 'URL is required'}), 400

        print(f"[ANALYZE] Scraping: {url}")
        html = scrape_website(url)
        content = clean_body_content(extract_body_content(html))

        analyzed_content[url] = content

        preview = content[:1000] + '...' if len(content) > 1000 else content
        return jsonify({'success': True, 'content': preview, 'message': 'Page analyzed successfully'})

    except Exception as e:
        print(f"[ANALYZE ERROR] {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        url = data.get('url')
        question = data.get('message')

        if not question:
            return jsonify({'error': 'Message is required'}), 400

        print(f"[CHAT] Q: {question}\n[CHAT] URL: {url}")

        context = analyzed_content.get(url, '')

        if len(context.strip()) < 100:
            print("[CHAT] Context missing or too short. Re-scraping...")
            try:
                html = scrape_website(url)
                context = clean_body_content(extract_body_content(html))

                if len(context.strip()) >= 100:
                    analyzed_content[url] = context
                    print("[CHAT] Cache updated.")
                else:
                    raise ValueError("Scraped content too short")

            except Exception as err:
                print(f"[CHAT] Scraping fallback failed: {err}")
                context = analyzed_content.get(url, "Limited product information available.")

        print(f"[CHAT] Context length: {len(context)}")

        reply = analyze_with_groq(context, question)

        return jsonify({'success': True, 'reply': reply})

    except Exception as e:
        print(f"[CHAT ERROR] {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
