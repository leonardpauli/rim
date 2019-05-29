# lexemize/syntax.py
# rimpy/p2
# created by Leonard Pauli, 21 may 2019

from ... import tokenize
from ...tokenize import base as tokenizeBase
from .. import semantic as Semantic

from .base import Base
from .number import Number
from .id import Id
from .expression import Expression

token_to_syntax_mapping = [
	(tokenize.Number, Number),
	(tokenize.Id, Id),
	(tokenize.Id.Special, Id),
	(tokenize.Id.Strip, Id.Strip),
	(tokenize.Id.Strip.Item, Expression),
	(tokenize.Expression, Expression)
]

semantic_to_syntax_mapping = [
	(Semantic.Number, Number),
	(Semantic.Number.BasicFloat, Number),
	(Semantic.Id, Id),
	(Semantic.Id.Strip, Id.Strip),
	# (Semantic.Expression, Expression)
]

def to_syntax_lexeme(token):
	if token is None: return None
	for Token, LexemeSyntax in token_to_syntax_mapping:
		if isinstance(token, Token):
			return LexemeSyntax.with_token(token)
	raise ValueError(f'no Lexeme.Syntax registered for token {repr(token)}, {type(token)}')

def from_semantic(semantic):
	if semantic is None: return None
	for SemanticType, LexemeSyntax in semantic_to_syntax_mapping:
		if isinstance(semantic, SemanticType):
			return LexemeSyntax.from_semantic(semantic)
	raise ValueError(f'no Lexeme.Syntax registered for semantic {repr(semantic)}, {type(semantic)}')


if __name__ == '__main__':
	# test
	pass
