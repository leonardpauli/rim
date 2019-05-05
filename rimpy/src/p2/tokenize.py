# tokenize.py
# rimpy/p2
# created by Leonard Pauli, 5 may 2019

import re


class TokenizationContext:
	prev = None # TokenizationContext

class Token:
	def __init__(self, start, end):
		# in the context of the line (a token cannot extend past a line)
		self.start = start
		self.end = end

	def raw(self, linestr):
		return linestr[self.start:self.end]

	def __repr__(self):
		return f'Token{{is {self.__class__.__name__}}}({repr(self.raw)})'

	def next_ctx(self, ctx):
		return ctx # or TokenizationContext to push

	pattern = None # str or regex
	@classmethod
	def match(cls, linestr, start):
		p = cls.pattern
		if type(p) is re.Pattern:
			m = p.match(linestr, start)
			return cls(start, m.span()[1]) if m else None
		if linestr.startswith(p):
			end = start + len(p)
			return cls(start, end)
		return None


class CommentTopHashbang(Token):
	pattern = And("#!", str)

class StringStart(Token):
	pattern = '"'
	def push(self, ctx):

