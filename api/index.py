import os
import sys

# Add root directory to sys.path so app.py can be imported cleanly
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from app import app as flask_app

class VercelWSGIMiddleware:
    def __init__(self, app):
        self.app = app

    def __call__(self, environ, start_response):
        path = environ.get('PATH_INFO', '')
        
        # Strip Vercel rewritten serverless prefixes
        if path.startswith('/api/index.py'):
            path = path[len('/api/index.py'):]
        elif path.startswith('/api/index'):
            path = path[len('/api/index'):]
            
        if not path:
            path = '/'
            
        environ['PATH_INFO'] = path
        return self.app(environ, start_response)

# Export app instance for Vercel Serverless Function
app = VercelWSGIMiddleware(flask_app)
