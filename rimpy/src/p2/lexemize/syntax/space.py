# lexemize/syntax/space
# rimpy/p2
# created by Leonard Pauli, 30 may 2019

from ... import tokenize
from ...tokenize import base as tokenizeBase
from .. import semantic

from .base import Base


class Space(Base):

	text = None # ""

	@property
	def single(self):
		return self.text == " "

	@single.setter
	def single(self, value):
		if value is True:
			self.text = " "
		else: raise Exception('todo: what does this mean?')


	def _repr_extra(self):
		return filter(lambda x: x, [
			('single' if self.single else f'text: "{repr(self.text)[1:-1]}"')
		])


	# init
	@classmethod
	def with_token(cls, token):
		s = cls()
		s.wrapper = token

		s.text = token.raw()

		return s


	# transformation

	def to_semantic(self):
		raise Exception('n/a')

	def __str__(self):
		return self.text

	@classmethod
	def from_semantic(cls, semantic):
		raise Exception('n/a')
