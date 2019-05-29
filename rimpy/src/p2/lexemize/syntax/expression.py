# lexemize/syntax/expression
# rimpy/p2
# created by Leonard Pauli, 29 may 2019

from ... import tokenize
from ...tokenize import base as tokenizeBase
from .. import semantic

from .base import Base


def handle(tokens):
	from . import to_syntax_lexeme
	if len(tokens) != 1:
		raise Exception(f'handle not implemented for len(tokens) other than 1 (got {repr(tokens)})')
	return to_syntax_lexeme(tokens[0])

class Expression(Base):

	# init
	@classmethod
	def with_token(cls, token):
		if isinstance(token, tokenize.Id.Strip.Item):
			return handle(token.patternMatch)
		if isinstance(token, tokenize.Element):
			pass
		raise Exception('todo')
