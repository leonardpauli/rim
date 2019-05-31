# lexemize/syntax/expression
# rimpy/p2
# created by Leonard Pauli, 29 may 2019

from ... import tokenize
from ...tokenize import base as tokenizeBase
from .. import semantic

from .base import Base
from .id import Id
from .space import Space


def get_parts(tokens):
	from . import to_syntax_lexeme
	for t in tokens:
		yield to_syntax_lexeme(t)

def groupify_strip(parts):
	cnt = len(parts)
	assert cnt > 0
	if cnt == 1: return parts[0]
	from .group import Group, GroupKind
	from .bind import Bind, Attach, BindKind

	res = parts[0]
	i = 1
	while i < cnt:
		val = parts[i]
		i += 1

		if isinstance(val, Group) and val.kind == GroupKind.Brace:
			res = Attach.with_value(res, val)
		elif isinstance(val, Group) and val.kind == GroupKind.Paren:
			res = Bind.with_values(res, [val], kind=BindKind.Prefix)
		else: raise Exception(f'unhandled groupify_strip case ({type(res)}, {type(val)}), ({res!r}, {val!r})')

	return res

def groupify(parts):
	cnt = len(parts)
	assert cnt > 0
	if cnt == 1: return parts[0]

	raise Exception('groupify > 1: todo')


class Expression(Base):

	parts = None # []
	space_start = None # "" TODO
	space_end = None # "" # TODO: in all space.(start, end), use Space instread of str

	def _repr_extra(self):
		return filter(lambda x: x, [
			self.space_start and f'space.start: "{repr(self.space_start)[1:-1]}"',
			self.space_end and f'space.end: "{repr(self.space_end)[1:-1]}"',
			f'({", ".join([repr(p) for p in self.parts])})' if self.parts else None,
		])

	# init
	@classmethod
	def with_token(cls, token, skip_grouping=False):
		if isinstance(token, tokenize.Id.Strip.Item):
			parts = list(get_parts(token.patternMatch))
			return (parts[0] if len(parts)==1 else parts) if skip_grouping else groupify_strip(parts)

		if isinstance(token, tokenize.Expression):
			parts = list(get_parts(token.unwrap()))
			space_start = parts.pop(0).text if len(parts) > 0 and isinstance(parts[0], Space) else None
			space_end = parts.pop().text if len(parts) > 0 and isinstance(parts[-1], Space) else None
			# print("OOO", parts)
			if not skip_grouping and len(parts): parts = [groupify(parts)]
			# print("GGG", parts)
			if skip_grouping or not len(parts) or space_start or space_end:
				s = cls()
				s.wrapper = token
				s.space_start = space_start
				s.space_end = space_end
				s.parts = parts
				return s
			else: return parts[0]
			
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
