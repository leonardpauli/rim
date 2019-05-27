# lexemize/syntax/base
# rimpy/p2
# created by Leonard Pauli, 21 may 2019


class LexemeSyntax():

	# token
	wrapper = None

	def _repr_extra(self):
		"""returns list of strings to be comma-joined added to __repr__"""
		return []
	def __repr__(self):
		inner_a = [f'is {self.__class__.__name__}']
		if self.wrapper is not None: inner_a.append(f'{self.wrapper.start}..{self.wrapper.end}')
		inner_a += self._repr_extra()
		inner = ", ".join(inner_a)
		return f'Lexeme.Syntax{{{inner}}}'

	@classmethod
	def with_token(cls, token):
		s = cls()
		s.wrapper = token
		return s

	def to_semantic(self):
		pass

	def copy_with_semantic(self, semantic):
		pass

	# @classmethod
	# def from_semantic(self, line_start):
	# 	pass

	def token_delta_update(self, semantic):
		# next = self.__class__.from_semantic(semantic, self.wrapper.start)
		# return TokenDeltaUpdate.Replace(source=self.wrapper, target=next.wrapper)
		pass


Base = LexemeSyntax
