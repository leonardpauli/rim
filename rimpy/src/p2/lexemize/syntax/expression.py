# lexemize/syntax/expression
# rimpy/p2
# created by Leonard Pauli, 29 may 2019

from ... import tokenize
from ...tokenize import base as tokenizeBase
from .. import semantic

from .base import Base


def get_parts(tokens):
	from . import to_syntax_lexeme
	space = None
	special = None
	for t in tokens:
		# Space.White, Id.Special, Id.Strip
		if isinstance(t, tokenizeBase.Space.White):
			if special:
				special.space_after = t.raw()
				yield special
				special = None
			else:
				space = t
		elif isinstance(t, tokenize.Id.Special):
			if special: yield special
			special = to_syntax_lexeme(t)
			if space:
				special.space_before = space.raw()
				space = None
		else:
			if special:
				yield special
				special = None
			yield to_syntax_lexeme(t)
	if special: yield special
	# if len(tokens) != 1:
	# 	raise Exception(f'handle not implemented for len(tokens) other than 1 (got {repr(tokens)})')

# def groupify

class Expression(Base):

	parts = None # []

	def _repr_extra(self):
		return filter(lambda x: x, [
			f'({", ".join([repr(p) for p in self.parts])})' if self.parts else None,
		])

	# init
	@classmethod
	def with_token(cls, token, skip_grouping=False):
		if isinstance(token, tokenize.Id.Strip.Item):
			return list(get_parts(token.patternMatch))[0]
		if isinstance(token, tokenize.Expression):
			parts = list(get_parts(token.unwrap()))
			if skip_grouping:
				s = cls()
				s.wrapper = token
				s.parts = parts
				return s
		raise Exception(f'token type not handled: {type(token)} (skip_grouping: {skip_grouping})')

	@classmethod
	def from_semantic(cls, semantic):
		raise Exception('todo')



class Element(Base):

	# init
	@classmethod
	def with_token(cls, token):
		from . import to_syntax_lexeme
		return to_syntax_lexeme(token.patternMatch)



class Group(Base):

	parts = None # []

	def _repr_extra(self):
		return filter(lambda x: x, [
			f'({", ".join([repr(p) for p in self.parts])})' if self.parts else None,
		])

	# init
	@classmethod
	def with_token(cls, token):
		# TODO
		assert isinstance(token, tokenize.Expression)
		parts = list(get_parts(token.unwrap()))
		if skip_grouping:
			s = cls()
			s.wrapper = token
			s.parts = parts
			return s

	@classmethod
	def from_semantic(cls, semantic):
		raise Exception('todo')
