# lexemize/syntax/group
# rimpy/p2
# created by Leonard Pauli, 30 may 2019

from ... import tokenize
from ...tokenize import base as tokenizeBase
from .. import semantic

from .base import Base
from .expression import Expression


class GroupKind():
	start = "("
	end = ")"
	name = "paren"

class Paren(GroupKind):
	pass
class Brace(GroupKind):
	start = "{"
	end = "}"
	name = "brace"
class Bracket(GroupKind):
	start = "["
	end = "]"
	name = "bracket"

GroupKind.Paren = Paren
GroupKind.Brace = Brace
GroupKind.Bracket = Bracket

token_to_kind_map = {
	tokenize.Group.Paren: GroupKind.Paren,
	tokenize.Group.Brace: GroupKind.Brace,
	tokenize.Group.Bracket: GroupKind.Bracket,
}


class Group(Base):

	value = None # Syntax
	kind = None # kinds
	space_start = None # " "
	space_end = None # " "
	closed = True

	def _repr_extra(self):
		return filter(lambda x: x, [
			f'kind: {self.kind.name}',
			f'not closed' if not self.closed else None,
			f'space.start: "{repr(self.space_start)[1:-1]}"' if self.space_start else None,
			f'space.end: "{repr(self.space_end)[1:-1]}"' if self.space_end else None,
			f'({", ".join([repr(p) for p in [self.value]])})' if self.value else None,
		])

	# init
	@classmethod
	def with_token(cls, token):
		from . import to_syntax_lexeme
		s = cls()
		s.wrapper = token

		paren = token.patternMatch
		s.kind = token_to_kind_map[type(paren)]
		_start, space_start, content, space_end, end = paren.patternMatch
		s.space_start = space_start and space_start.raw()
		s.space_end = space_end and space_end.raw()
		s.closed = end is not None

		s.value = content and to_syntax_lexeme(content)
		if s.value and isinstance(s.value, Expression):
			assert s.space_end is None
			s.space_end = s.value.space_end
			if len(s.value.parts)==1:
				s.value = s.value.parts[0]

		return s

	@classmethod
	def with_value(cls, value, kind=GroupKind.Paren):
		s = cls()
		s.value = value
		s.kind = kind
		s.closed = True
		return s


	# transformation

	def to_semantic(self):
		s = semantic.Group()
		s.syntax = self

		s.kind = self.kind
		s.closed = self.closed
		s.value = self.value and self.value.to_semantic()

		return s

	def __str__(self):
		return "".join(filter(lambda x: x, [
			self.kind.start,
			self.space_start,
			self.value and str(self.value),
			self.space_end,
			self.closed and self.kind.end,
		]))

	@classmethod
	def from_semantic(cls, semantic):
		from . import from_semantic
		s = cls()
		
		s.kind = semantic.kind
		s.closed = semantic.closed
		s.value = semantic.value and from_semantic(semantic.value)
		if semantic.syntax:
			s.space_start = semantic.syntax.space_start
			s.space_end = semantic.syntax.space_end

		return s
