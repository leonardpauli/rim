# tokenize.py
# rimpy/p2
# created by Leonard Pauli, 5 may 2019

import re
import sys

from src.lib.match import match, And, Or, Option, Many
from .tokenize_base import *



# tokens


class Indent(TokenizeContext):
	class Tab(Token):
		pattern = "\t"
	class Space2(Token):
		pattern = "  "
	pattern = Option(Many(Or(Tab, Space2)))



# declare

class Line(TokenizeContext): pass

class Expression(TokenizeContext): pass

class Element(TokenizeContext):
	class Part(TokenizeContext): pass
	pattern = Many(Part)



# comment

class Comment:
	class Top(TokenizeContext):
		class Start(Token):
			pattern = "#"
		class Hashbang(TokenizeContext):
			class Start(Token):
				pattern = "!"
			pattern = And(Start, Str)
		class Body(TokenizeContext): pass
		pattern = And(Start, Or(Hashbang, Body))

	class Line(TokenizeContext):
		class Start(Token):
			pattern = "//"
		pattern = And(Start, Option(Or(And(Space, Option(Str)), Line)))

	class Block(TokenizeContext):
		class Start(Token):
			pattern = "'"
		pattern = And(Start, Option(Or(And(Space, Option(Str)), Line)))



# file/line

Line.pattern = And(Indent, Option(Space.White), Or(Comment.Top, Comment.Block, Expression), Option(Space.White), Option(Comment.Line))

# Logic for tokenizing whole file elsewhere
# class File(TokenizeContext):
# 	pattern = Option(Many(Line))



# primitives

class String(TokenizeContext):
	class Start(Token):
		pattern = '"'
	class End(Token):
		pattern = '"'
	class Escape(TokenizeContext):
		class Start(Token):
			pattern = '\\'
	class Char(Token):
		@classmethod
		def match(cls, linestr, start=0):
			if start >= len(linestr): return None
			l = linestr[start]
			if l == String.End.pattern: return None
			return cls(start, start+1)

String.pattern = And(String.Start, Option(Many(Or(String.Escape, String.Char))), Option(String.End))
String.Escape.pattern = And(String.Escape.Start, Option(Or(String.Escape.Start, String.End, Element)))


class Number(TokenizeContext):
	class Spacing(Token):
		pattern = "_"
	class LeadingZeros(TokenizeContext): pass
	class Whole(TokenizeContext): pass
	class Decimal(TokenizeContext):
		class Dot(Token):
			pattern = "."

	# 000 52_300 . 322_000
	pattern = And(Whole, Option(Decimal))

Number.LeadingZeros.pattern = And(Digit.Zero, Option(Many(Or(Digit.Zero, Number.Spacing))))
Number.Whole.pattern = And(Or(Number.LeadingZeros, Digit), Option(Many(Or(Digit, Number.Spacing))))
Number.Decimal.pattern = And(Number.Decimal.Dot, Many(Or(Digit, Number.Spacing)))



# group


class Group(TokenizeContext):
	@staticmethod
	def setPattern(cls):
		cls.pattern = And(cls.Start, Option(Space.White), Option(Or(Expression, Id.Strip)), Option(Space.White), Option(cls.End))

	class Paren(TokenizeContext):
		class Start(Token):
			pattern = "("
		class End(Token):
			pattern = ")"

	class Brace(TokenizeContext):
		class Start(Token):
			pattern = "{"
		class End(Token):
			pattern = "}"

	class Bracket(TokenizeContext):
		class Start(Token):
			pattern = "["
		class End(Token):
			pattern = "]"

	pattern = Or(Paren, Brace, Bracket)



# id

class Id(TokenizeContext):
	class Strip(TokenizeContext):
		class Dot(Token):
			pattern = "."
		class Item(TokenizeContext): pass
		pattern = And(Option(Dot), Item, Option(Many(And(Dot, Item))))

	class Special(TokenizeContext):
		class Char(Token):
			@classmethod
			def is_special_symbol_char(cls, l):
				"""
				TODO: might not be precise, not so black n white
				goal: a special symbol may act as a word separator,
					thus, should not be a "letter", though seemed easier to define it as all
					unicode chars in "unicode symbol blocks" except eg. emojis and some
					letters that happend to be there?
				"""
				c = ord(l)
				if c < 0xC0:
					for r in ('_$ "(){}[]', 'ŠŒŽšœžŸ'):
						if l in r: return False
					for r in (range(0x30, 0x39+1), range(0x41, 0x5A+1), range(0x61, 0x7A+1)):
						if c in r: return False
					return True
				# symbols
				if c in range(0x2000, 0x2800):
					for r in ("⌚⌛", "⏩⏪⏫⏬⏭⏮⏯⏰⏱⏲⏳⏴⏵⏶⏷⏸⏹⏺", "☄☔☕☘☝☠☢☣☦☪☮☯☸♈♉♊♋♌♍♎♏♐♑♒♓♿⚒⚓⚔⚕⚖⚗⚙⚛⚜⚡⚪⚫⚰⚱⚽⚾⛄⛅⛈⛎⛏⛑⛓⛔⛩⛪⛰⛱⛲⛳⛴⛵⛷⛸⛹⛺⛽✅✊✋✌✍✨❌❎❓❔❕❗➕➖➗➰➿"):
						if l in r: return False
					return True
				if c in range(0x2900, 0x2c00):
					for r in ("⬛⭐⭕"):
						if l in r: return False
					return True
				if c in range(0x3000, 0x3040): True
				return False

			@classmethod
			def match(cls, linestr, start=0):
				if start >= len(linestr): return None
				if linestr.startswith('//', start): return None
				l = linestr[start]
				return cls(start, start+1) if cls.is_special_symbol_char(l) else None

		pattern = Many(Char)


	class Base(Token):
		allowed_chars = '_$'
		disallowed_chars = '(){}[]" \t/'
		disallowedTokens = [] # see below

		@classmethod
		def match(cls, linestr, start=0):
			if start >= len(linestr): return None
			l = linestr[start]
			if l in cls.allowed_chars:
				pass
			elif l in cls.disallowed_chars:
				return None
			else:
				v, r, ok = match(Or(*cls.disallowedTokens), (linestr, start))
				if ok: return None
			return cls(start, start+1)

	class Start(Base): pass
	class Middle(Base): pass
	class Tail(TokenizeContext):
		@classmethod
		def process_patternMatch(cls, v):
			if type(v) is list:
				middle, *rest = v
				vs = rest[0].patternMatch if len(rest)==1 and type(rest[0]) is cls else rest
				return [middle, *vs] if type(vs) is list else [middle, vs]
			return v

	pattern = And(Start, Option(Tail))
	@classmethod
	def process_patternMatch(cls, v):
		return [v[0]] if not v[1] else [v[0], v[1].patternMatch]


Id.Base.disallowedTokens = [Id.Special]
Id.Start.disallowedTokens = Id.Base.disallowedTokens+[Digit]
Id.Middle.allowed_chars = Id.Base.allowed_chars+'-'
Id.Middle.disallowedTokens = Id.Base.disallowedTokens
Id.Tail.pattern = Or(And(Id.Middle, Id.Tail), Id.Base)



# bind declared

Comment.Top.Body.pattern = And(Option(Space), Option(Many(Or(Space.White, Comment.Line, String, Char))))
Expression.pattern = Many(Or(Space.White, Id.Special, Element))
Element.Part.pattern = Or(String, Group, Number, Id.Strip)
Id.Strip.Item.pattern = Many(Or(String, Group, Number, Id))
Element.pattern = Element.Part.pattern

Group.setPattern(Group.Paren)
Group.setPattern(Group.Brace)
Group.setPattern(Group.Bracket)


# test

def test():
	# import doctest
	# doctest.testmod()

	a = Indent.match('\t')
	assert repr(a) == 'TokenizeContext{is Indent, 0..1}'

	a = Indent.Space2.match('  asdf')
	assert a is not None
	
	linestr = '\t  \t s\t'
	a = Indent.match(linestr)
	assert a.end == 4
	assert len(a.patternMatch) == 3

	s = '33.126_200'
	a = Number.match(s)
	assert a is not None
	# print(a.repr_unfolded(s))

	s = r'"hello \"name\""'
	a = String.match(s)
	assert a is not None
	# print(a.repr_unfolded(s))
	
	s = r'abc_de'
	a = Id.match(s)
	assert a is not None
	# print(a.repr_unfolded(s))
	
	s = r'*'
	a = Id.Special.match(s)
	assert a is not None
	# print(a.repr_unfolded(s))
	
	s = r'a'
	a = Id.Strip.match(s)
	assert a is not None
	# print(a.repr_unfolded(s))
	
	s = r'a.b."c".d.0'
	a = Id.Strip.match(s)
	assert a is not None
	# print(a.repr_unfolded(s))

	s = r'a().b{c.d}() ()'
	a = Id.Strip.match(s)
	assert a is not None
	# print(a.repr_unfolded(s))
	
	s = r'(a)'
	a = Expression.match(s)
	assert a is not None
	# print(a.repr_unfolded(s))

	s = r'3 * 5 +2/(a.b + "lal")'
	a = Expression.match(s)
	assert a is not None
	# print(a.repr_unfolded(s))

	s = r'	  	 a."b\t".k{d: x+y*(3-1); some}.c(e) f g // hello'
	a = Line.match(s)
	assert a is not None
	# print(a.repr_unfolded(s))

	s = r'#!/usr/bin/env rim'
	a = Line.match(s)
	assert a is not None
	# print(a.repr_unfolded(s))

	s = r"' comment // line" # todo: add separation of line-comments in block-comments
	a = Line.match(s)
	assert a is not None
	# print(a.repr_unfolded(s))
	
	s = r'a //:show{param} some // ... result here ...'
	a = Line.match(s)
	assert a is not None
	print(a.repr_unfolded(s))

	print('success')



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
				with open(os.path.join(os.path.dirname(__file__), 'tokenizer-expand-viz.html'), 'rb') as f:
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
