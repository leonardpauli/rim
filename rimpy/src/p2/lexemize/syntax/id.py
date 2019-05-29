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

	def _repr_extra(self):
		return filter(lambda x: x, [
			f'special' if self.special else None,
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
		s.text = self.text
		# todo: do initial special infix groping at syntax level?
		return s

	def __str__(self):
		return self.text

	def copy_with_semantic(self, semantic):
		linestr = semantic.text
		token = tokenize.Id.Special.match(linestr)
		# special = True
		if not token:
			# special = False
			token = tokenize.Id.match(linestr)
		s = self.__class__.with_token(token)
		return s



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
		s = cls()
		s.wrapper = token

		from . import to_syntax_lexeme
		s.parts = [to_syntax_lexeme(p) for p in token.unwrap() if isinstance(p, tokenize.Id.Strip.Item)]

		return s


	# transformation

	def to_semantic(self):
		s = semantic.Id.Strip()
		s.parts = [p.to_semantic() for p in self.parts]
		return s

	def __str__(self):
		return ".".join([str(p) for p in self.parts]) # todo: use syntax

	# TODO: attach syntax to semantic and reconstruct recursively using that, instead of trying to match afterwards
	def copy_with_semantic(self, semantic):
		linestr = ".".join([str(p) for p in semantic.parts]) # todo: use syntax
		print(linestr)
		token = tokenize.Id.Strip.match(linestr)
		s = self.__class__.with_token(token)
		return s


Id.Strip = Strip
