# lexemize/syntax.py
# rimpy/p2
# created by Leonard Pauli, 21 may 2019

from ... import tokenize
from ...tokenize import base as tokenizeBase

from .base import Base
from .number import Number
from .id import Id
from .expression import Expression

mapping = [
	(tokenize.Number, Number),
	(tokenize.Id, Id),
	(tokenize.Id.Special, Id),
	(tokenize.Id.Strip, Id.Strip),
	(tokenize.Id.Strip.Item, Expression),
	(tokenize.Expression, Expression)
]

def to_syntax_lexeme(token):
	if token is None: return None
	for Token, LexemeSyntax in mapping:
		if isinstance(token, Token):
			return LexemeSyntax.with_token(token)
	raise ValueError(f'no Lexeme.Syntax registered for token {repr(token)}')

if __name__ == '__main__':
	# test
	pass
