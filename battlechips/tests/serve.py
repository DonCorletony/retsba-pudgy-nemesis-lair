"""Threaded static server for the browser checks.

`python3 -m http.server` is single-threaded: a lazily-imported chunk that pulls
its JS and CSS at once gets one of the two connections reset, which surfaces as
"Unable to preload CSS" and looks exactly like an application bug. It isn't.

    python3 tests/serve.py 4192 dist
"""
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

port = int(sys.argv[1]) if len(sys.argv) > 1 else 4192
root = sys.argv[2] if len(sys.argv) > 2 else 'dist'


class Handler(SimpleHTTPRequestHandler):
    def log_message(self, *args):  # quiet
        pass


ThreadingHTTPServer(('127.0.0.1', port), partial(Handler, directory=root)).serve_forever()
