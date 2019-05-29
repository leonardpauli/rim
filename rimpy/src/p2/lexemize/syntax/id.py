# lexemize/syntax/id
# rimpy/p2
# created by Leonard Pauli, 21 may 2019

from ... import tokenize
from ...tokenize import base as tokenizeBase
from .. import semantic

from .base import Base


class Id(Base):

	text = None # ""
	special = False
	space_before = None # ""
	space_after = None # ""

	def _repr_extra(self):
		return filter(lambda x: x, [
			f'special' if self.special else None,
			f'space.before: "{repr(self.space_before)[1:-1]}"' if self.space_before else None,
			f'space.after: "{repr(self.space_after)[1:-1]}"' if self.space_after else None,
			f'text: "{repr(self.text)[1:-1]}"',
		])


	# init
	@classmethod
	def with_token(cls, token):
		s = cls()
		s.wrapper = token

		s.special = isinstance(token, tokenize.Id.Special)
		s.text = token.raw()

		return s


	# transformation

	def to_semantic(self):
		s = semantic.Id()
		s.syntax = self
		s.text = self.text
		# todo: do initial special infix groping at syntax level?
		return s

	def __str__(self):
		return self.text

	@classmethod
	def from_semantic(cls, semantic):
		# use semantic.syntax?
		linestr = semantic.text
		# todo: handle if it's special correctly?
		token = tokenize.Id.Special.match(linestr)
		# special = True
		if not token:
			# special = False
			token = tokenize.Id.match(linestr)
		return cls.with_token(token)



# id.strip

class Strip(Base):

	def __init__(self):
		self.parts = []

	def _repr_extra(self):
		return filter(lambda x: x, [
			f'({", ".join([repr(p) for p in self.parts])})',
		])


	# init
	@classmethod
	def with_token(cls, token):
		from . import to_syntax_lexeme
		parts = [to_syntax_lexeme(p) for p in token.unwrap() if isinstance(p, tokenize.Id.Strip.Item)]
		if len(parts)==1: return parts[0]

		s = cls()
		s.wrapper = token

		s.parts = parts

		return s


	# transformation

	def to_semantic(self):
		s = semantic.Id.Strip()
		s.syntax = self
		s.parts = [p.to_semantic() for p in self.parts]
		return s

	def __str__(self):
		return ".".join([str(p) for p in self.parts])

	@classmethod
	def from_semantic(cls, semantic):
		s = cls()
		from . import from_semantic
		s.parts = [from_semantic(p) for p in semantic.parts]
		return s


Id.Strip = Strip
