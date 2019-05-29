# lexemize/syntax/template
# rimpy/p2
# created by Leonard Pauli, 21 may 2019
"""
from ... import tokenize
from ...tokenize import base as tokenizeBase
from .. import semantic

from .base import Base


class Id(Base):

	some = None # ""

	@property
	def thing(self):
		return self._thing

	@thing.setter
	def thing(self, value):
		self._thing = value


	def _repr_extra(self):
		return filter(lambda x: x, [
			f'("{self._thing}")' if self._thing else None
		])


	# init
	@classmethod
	def with_token(cls, token):
		s = cls()
		s.wrapper = token

		s._thing = some

		return s


	# transformation

	def to_semantic(self):
		s = semantic.Id()
		s.syntax = self
		s.value = some
		return s

	def __str__(self):
		r = ""
		return r

	@classmethod
	def from_semantic(cls, semantic):
		s = cls()
		s.thing = semantic.thing
		return s
		
		# or

		linestr = some
		token = tokenize.Id.match(linestr)
		s = cls.with_token(token)
		if semantic.syntax:
			s.thing = semantic.syntax.thing
		return s
"""
