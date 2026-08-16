import os
import sys

# Ensure project root directory is in sys.path
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from app import app as flask_app

class VercelWSGIMiddleware:
    def __init__(self, app):
        self.app = app

    def __call__(self, environ, start_response):
        path = environ.get('PATH_INFO', '')
        
        # Strip Vercel serverless function prefixes if present
        for prefix in ['/api/index.py', '/api/index']:
            if path.startswith(prefix):
                path = path[len(prefix):]
                break
                
        if not path or path == '':
            path = '/'
            
        environ['PATH_INFO'] = path
        return self.app(environ, start_response)

# Export app instance for Vercel Python Serverless Function
app = VercelWSGIMiddleware(flask_app)
