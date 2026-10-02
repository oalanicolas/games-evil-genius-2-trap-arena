"""Lair engine dev server. Loopback only; library files are served one by one from an allowlist.

    python3 prototypes/evil-genius-2-trap-arena/engine/server.py            # http://127.0.0.1:8767/covil.html
"""
import argparse
import json
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

HERE = Path(__file__).resolve().parent
PROTO = HERE.parent
LIB = PROTO.parents[1] / 'libraries/evil-genius-2'


def allowed():
    files = set(json.loads((PROTO / 'asset-manifest.json').read_text())['files'])
    pack = HERE / 'content/eg2/allow.json'
    if pack.exists():
        files |= set(json.loads(pack.read_text())['files'])
    return files


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def translate_path(self, path):
        path = unquote(urlsplit(path).path)
        if path.startswith('/library/'):
            relative = path.removeprefix('/library/')
            # Re-read per request: the content build may have added files since start-up.
            return str(LIB / relative) if relative in allowed() else str(PROTO / '__not_allowed__')
        candidate = (PROTO / path.lstrip('/')).resolve()
        if not candidate.is_relative_to(PROTO):
            return str(PROTO / '__not_allowed__')
        return str(candidate)

    def log_message(self, *args):
        pass


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8767)
    args = parser.parse_args()
    print(f'Lair engine: http://127.0.0.1:{args.port}/covil.html', flush=True)
    ThreadingHTTPServer(('127.0.0.1', args.port), Handler).serve_forever()
