import mimetypes
import json
import os
import urllib.request
import urllib.error
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("text/css", ".css")
mimetypes.add_type("application/json", ".json")

def load_env():
    env_path = Path(__file__).parent.parent / '.env'
    if env_path.exists():
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip()

load_env()

def get_llm_config():
    provider = os.environ.get('LLM_PROVIDER', 'doubao').lower()
    
    configs = {
        'doubao': {
            'api_key': os.environ.get('DOUBAO_API_KEY', ''),
            'base_url': os.environ.get('DOUBAO_BASE_URL', 'https://ark.cn-beijing.volces.com/api/v3'),
            'model': os.environ.get('DOUBAO_MODEL', 'doubao-1-5-pro-32k-250115')
        },
        'openai': {
            'api_key': os.environ.get('OPENAI_API_KEY', ''),
            'base_url': os.environ.get('OPENAI_BASE_URL', 'https://api.openai.com/v1'),
            'model': os.environ.get('OPENAI_MODEL', 'gpt-4')
        }
    }
    
    return configs.get(provider, configs['doubao']), provider

class APIProxyHandler(SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/api/chat':
            self.handle_chat_api()
        else:
            self.send_error(404, 'Not Found')
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def handle_chat_api(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            request_data = json.loads(body.decode('utf-8'))
            
            config, provider = get_llm_config()
            
            if not config['api_key']:
                self.send_json_error(500, f'API key not configured for provider: {provider}. Please check your .env file.')
                return
            
            api_url = f"{config['base_url']}/chat/completions"
            
            payload = {
                'model': config['model'],
                'messages': request_data.get('messages', []),
                'temperature': request_data.get('temperature', 0.7),
                'max_tokens': request_data.get('max_tokens', 500)
            }
            
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f"Bearer {config['api_key']}"
            }
            
            req = urllib.request.Request(
                api_url,
                data=json.dumps(payload).encode('utf-8'),
                headers=headers,
                method='POST'
            )
            
            try:
                with urllib.request.urlopen(req, timeout=30) as response:
                    result = json.loads(response.read().decode('utf-8'))
                    self.send_json_response(200, result)
            except urllib.error.HTTPError as e:
                error_body = e.read().decode('utf-8')
                self.send_json_error(e.code, f'LLM API error: {error_body}')
            except urllib.error.URLError as e:
                self.send_json_error(500, f'Network error: {str(e.reason)}')
                
        except json.JSONDecodeError:
            self.send_json_error(400, 'Invalid JSON in request body')
        except Exception as e:
            self.send_json_error(500, f'Server error: {str(e)}')
    
    def send_json_response(self, status_code, data):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))
    
    def send_json_error(self, status_code, message):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps({'error': message}).encode('utf-8'))
    
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

if __name__ == '__main__':
    config, provider = get_llm_config()
    print(f"Starting server on http://0.0.0.0:8000")
    print(f"LLM Provider: {provider}")
    print(f"API Key configured: {'Yes' if config['api_key'] else 'No - Please create .env file'}")
    ThreadingHTTPServer(("0.0.0.0", 8000), APIProxyHandler).serve_forever()
