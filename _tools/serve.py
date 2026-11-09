"""Local static server that behaves like Cloudflare Pages for clean URLs:
/about serves about.html, and /about.html 308-redirects to /about. Usage: python serve.py <dir> <port>"""
import http.server, os, sys
from functools import partial
ROOT = os.path.abspath(sys.argv[1])
class H(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        path, _, query = self.path.partition('?')
        if path.endswith('.html') and path not in ('/404.html',):
            clean = path[:-5]
            clean = '/' if clean == '/index' else clean
            self.send_response(308); self.send_header('Location', clean + ('?' + query if query else '')); self.end_headers(); return
        if path != '/' and not os.path.splitext(path)[1] and os.path.isfile(os.path.join(ROOT, path.lstrip('/') + '.html')):
            self.path = path + '.html' + ('?' + query if query else '')
        return super().do_GET()
    def log_message(self, *a): pass
http.server.ThreadingHTTPServer(('127.0.0.1', int(sys.argv[2])), partial(H, directory=ROOT)).serve_forever()
