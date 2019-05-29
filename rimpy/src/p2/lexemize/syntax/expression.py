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
	if space: yield space
	# if len(tokens) != 1:
	# 	raise Exception(f'handle not implemented for len(tokens) other than 1 (got {repr(tokens)})')

# def groupify

class Expression(Base):

	parts = None # []
	space_end = None # ""

	def _repr_extra(self):
		return filter(lambda x: x, [
			self.space_end and f'space.end: "{repr(self.space_end)[1:-1]}"',
			f'({", ".join([repr(p) for p in self.parts])})' if self.parts else None,
		])

	# init
	@classmethod
	def with_token(cls, token, skip_grouping=False):
		if isinstance(token, tokenize.Id.Strip.Item):
			return list(get_parts(token.patternMatch))[0]
		if isinstance(token, tokenize.Expression):
			parts = list(get_parts(token.unwrap()))
			if skip_grouping or not len(parts):
				s = cls()
				s.wrapper = token
				s.parts = parts
				return s

			space_end = parts[-1]
			if isinstance(space_end, tokenizeBase.Space.White):
				parts = parts[:-1]
				space_end = space_end.raw()
			else: space_end = None

			if len(parts)==1 and not space_end: return parts[0]
			if len(parts)==1:
				s = cls()
				s.wrapper = token
				s.parts = parts
				s.space_end = space_end
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

token_to_kind_map = {
	tokenize.Group.Paren: Paren,
	tokenize.Group.Brace: Brace,
	tokenize.Group.Bracket: Bracket,
}


class Group(Base):

	value = None # Syntax
	kind = None # kinds
	space_start = None # " "
	space_end = None # " "
	closed = False

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
		if s.value and isinstance(s.value, Expression) and len(s.value.parts)==1:
			assert s.space_end is None
			s.space_end = s.value.space_end
			s.value = s.value.parts[0]

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
