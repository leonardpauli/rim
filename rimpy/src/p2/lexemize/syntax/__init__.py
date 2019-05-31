# lexemize/syntax.py
# rimpy/p2
# created by Leonard Pauli, 21 may 2019

from ... import tokenize
from ...tokenize import base as tokenizeBase
from .. import semantic as Semantic

from .base import Base
from .number import Number
from .id import Id
from .string import String
from .expression import Expression, Element
from .group import Group
from .bind import Bind, Attach
from .space import Space


token_to_syntax_mapping = [
	(tokenize.Number, Number),
	
	(tokenize.Id, Id),
	(tokenize.Id.Special, Id),
	(tokenize.Id.Strip, Id.Strip),
	(tokenize.Id.Strip.Item, Expression),
	
	(tokenize.String, String),
	(tokenize.String.Escape, String.Escape),
	
	(tokenize.Expression, Expression),
	(tokenize.Element, Element),

	(tokenize.Group, Group),
	(tokenize.Group.Paren, Group),
	(tokenize.Group.Brace, Group),
	(tokenize.Group.Bracket, Group),

	# bind, attach

	(tokenizeBase.Space, Space),
	(tokenizeBase.Space.White, Space),
]


semantic_to_syntax_mapping = [
	(Semantic.Number, Number),
	(Semantic.Number.BasicFloat, Number),
	
	(Semantic.Id, Id),
	(Semantic.Id.Strip, Id.Strip),
	
	(Semantic.String, String),
	# (Semantic.String.Escape, String.Escape)
	
	# (Semantic.Expression, Expression)
	
	(Semantic.Group, Group),

	(Semantic.Bind, Bind),
	(Semantic.Attach, Attach),

	# space
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
