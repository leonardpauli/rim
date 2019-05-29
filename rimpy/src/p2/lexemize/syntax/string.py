# lexemize/syntax/string
# rimpy/p2
# created by Leonard Pauli, 29 may 2019

from ... import tokenize
from ...tokenize import base as tokenizeBase
from .. import semantic

from .base import Base


class Escape(Base):
	
	value = None

	def _repr_extra(self):
		return [f'({repr(self.value)})']


	# init
	@classmethod
	def with_token(cls, token):
		from . import to_syntax_lexeme
		s = cls()
		s.wrapper = token

		if len(token.patternMatch) > 1:
			t = token.patternMatch[1]
			if isinstance(t, tokenize.String.Escape.Start) or isinstance(t, tokenize.String.End):
				s.value = t.raw()
			else:
				s.value = to_syntax_lexeme(t)

		return s

	@classmethod
	def with_char(cls, c):
		s = cls()
		s.value = c
		return s


	# transformation

	def to_semantic(self):
		raise Exception('not applicable')


	def __str__(self):
		return '\\'+str(self.value) if self.value is not None else '\\'


	@classmethod
	def from_semantic(cls, semantic):
		raise Exception('not applicable')



class String(Base):

	parts = None # []
	closed = False

	def _repr_extra(self):
		vlist = [(f'"{p}"' if type(p) is str else repr(p)) for p in self.parts]
		return filter(lambda x: x, [
			f'({", ".join(vlist)})'
		])


	# init
	@classmethod
	def with_token(cls, token):
		from . import to_syntax_lexeme
		s = cls()
		s.wrapper = token

		parts = list(token.unwrap())[1:]
		closed = False
		if len(parts) and isinstance(parts[-1], tokenize.String.End):
			closed = True
			parts = parts[:-1]

		s.parts = []
		laststr = None
		for t in parts:
			if isinstance(t, tokenize.String.Char):
				if laststr is None: laststr = ""
				laststr += t.raw()
			else:
				if laststr is not None:
					s.parts.append(laststr)
					laststr = None
				s.parts.append(to_syntax_lexeme(t))
		if laststr is not None: s.parts.append(laststr)

		return s


	# transformation

	def to_semantic(self):
		s = semantic.String()
		s.syntax = self

		s.parts = []
		laststr = None
		for p in self.parts:
			if type(p) is str:
				if laststr is None: laststr = p
				else: laststr += p
			elif isinstance(p, Escape) and type(p.value) is str:
				if laststr is None: laststr = p.value
				else: laststr += p.value
			else:
				if laststr is not None:
					s.parts.append(p)
					laststr = None
				s.parts.append(p.to_semantic())
		if laststr is not None: s.parts.append(laststr)

		return s


	def __str__(self):
		# todo: escape expression, etc? or is it supposed to be already wrapped in Escape?
		return '"'+"".join([str(p) for p in self.parts])+'"'


	@classmethod
	def from_semantic(cls, semantic):
		s = cls()

		from . import from_semantic
		
		s.parts = []
		for p in semantic.parts:
			if type(p) is str:
				laststr = None
				for c in p:
					if c=='"' or c=='\\':
						if laststr:
							s.parts.append(laststr)
							laststr = None
						s.parts.append(Escape.with_char(c))
					else:
						if laststr is None: laststr = c
						else: laststr += c
				if laststr: s.parts.append(laststr)
			else: s.parts.append(from_semantic(p))

		return s

String.Escape = Escape
