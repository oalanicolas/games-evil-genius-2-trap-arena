"""Local-only prototype; library files are read-only and individually allowlisted."""
import argparse
import json
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

HERE = Path(__file__).resolve().parent
LIB = HERE.parents[1] / 'libraries/evil-genius-2'
ALLOW = set(json.loads((HERE/'asset-manifest.json').read_text())['files'])

class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # Local development must display the current source, including modules.
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def translate_path(self, path):
        path = unquote(urlsplit(path).path)
        if path.startswith('/library/'):
            relative = path.removeprefix('/library/')
            return str(LIB/relative) if relative in ALLOW else str(HERE/'__not_allowed__')
        candidate = (HERE/path.lstrip('/')).resolve()
        if not candidate.is_relative_to(HERE):
            return str(HERE/'__not_allowed__')
        return str(candidate)

    def log_message(self, *args):
        pass

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8766)
    args = parser.parse_args()
    print(f'EG2 web reconstruction: http://127.0.0.1:{args.port}', flush=True)
    ThreadingHTTPServer(('127.0.0.1', args.port), Handler).serve_forever()
