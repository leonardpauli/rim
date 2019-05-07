# tokenize/__main__.py
# rimpy/p2
# created by Leonard Pauli, may 2019

import sys

from . import *
from .base import *


# repl

def repl():
	isa = sys.stdin.isatty()
	if isa: print('Welcome to tokenize repl; enter a line and hit enter to show tokenization')
	while True:
		inp = input('> ' if isa else '')
		r = Line.match(inp)
		if r:
			print(r.repr_unfolded(inp))
			if len(inp)>r.end:
				print(f'rest: {repr(inp[r.end:])}')
		else:
			print('No match')


# repl server

def serve_http(port):
	import time
	from http.server import HTTPServer, BaseHTTPRequestHandler
	import os.path

	class Server(BaseHTTPRequestHandler):
		def set_headers(self, status_code=200, content_type='text/html', **headers):
			self.send_response(status_code)
			self.send_header('Content-Type', content_type)
			for k, v in headers: self.send_header(k, v)
			self.end_headers()

		def do_GET(self):
			if self.path == '/':
				with open(os.path.join(os.path.dirname(__file__), 'expand-viz.html'), 'rb') as f:
					self.set_headers()
					self.wfile.write(f.read())
			else:
				self.set_headers(status_code=404)
				self.wfile.write(bytes('Not found', 'UTF-8'))

		def do_POST(self):
			if self.path == '/tokenize':
				self.set_headers(content_type='text/plain')
				try:
					cnt = int(self.headers['Content-Length'])
				except: cnt = 0

				lines = self.rfile.read(cnt).decode().split('\n')
				if len(lines)!=1:
					self.wfile.write(bytes(f'expected 1 and only 1 line, got {len(lines)}', 'UTF-8'))
				else:
					s = lines[0]
					r = Line.match(s)
					res = ""
					if not r: res += 'no match'
					else:
						res += r.repr_unfolded(s)+'\n'
						if len(s)>r.end:
							pre = ''.join([' ' for _ in range(0, r.end)])
							res += pre+f'{s[r.end:]} X rest'
					self.wfile.write(bytes(res, 'UTF-8'))
			else:
				self.set_headers(status_code=404)
				self.wfile.write(bytes('Not found', 'UTF-8'))


	hostname = "localhost"
	with HTTPServer((hostname, port), Server) as httpd:
		print(f'{time.asctime()}: serving at http://{hostname}:{port}')
		try: httpd.serve_forever()
		except KeyboardInterrupt: pass
		httpd.server_close()
		print(f'{time.asctime()}: server close')



# main

# cd rimpy && python3.7 -m src.p2.tokenize --http
if __name__ == '__main__':
	args = sys.argv[1:]
	isa = sys.stdin.isatty()
	if len(args) == 1 and args[0]=='--test':
		test()
		exit()
	if 1 <= len(args) < 2 and args[0]=='--http':
		port = int(args[1]) if len(args) > 1 else 8000
		serve_http(port)
		exit()
	if isa:
		print('usage:')
		print('\t- tokenize --test # to test')
		print('\t- echo \'some (expr)\' | tokenize > some_file.out # stdin usage')
		print('\t- tokenize --http [8000] # serve interactive tokenize explorer at localhost:8000')
		print('\t- tokenize # repl')
		print()
	if len(args) != 0:
		print('faulty args')
		exit()
	try:
		repl()
	except EOFError: pass
	except KeyboardInterrupt: pass
