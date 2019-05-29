# lexemize/syntax/id
# rimpy/p2
# created by Leonard Pauli, 21 may 2019

from ... import tokenize
from ...tokenize import base as tokenizeBase
from .. import semantic

from .base import Base


class Id(Base):

	text = ""
	special = False

	def _repr_extra(self):
		return filter(lambda x: x, [
			f'special' if self.special else None,
			f'("{self.text}")',
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
