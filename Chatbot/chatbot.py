from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("models/gemini-pro")

app = Flask(__name__)
CORS(app)

@app.route('/chat', methods=['POST'])
def chat():
    try:
        user_input = request.json['message']
        full_prompt = "အမြဲ မြန်မာဘာသာဖြင့် ဖြေပါ။\n\n" + user_input
        response = model.generate_content(full_prompt)
        return jsonify({'reply': response.text.strip()})
    except Exception as e:
        return jsonify({'reply': f'❌ အမှား: {str(e)}'})

if __name__ == '__main__':
    app.run(port=5000)
