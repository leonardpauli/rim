# lexemize/semantic.py
# rimpy/p2
# created by Leonard Pauli, 21 may 2019


# base

class LexemeSemantic():
	def _repr_extra(self):
		return []
	def __repr__(self):
		inner = ", ".join([f'is {self.__class__.__name__}']+self._repr_extra())
		return f'Lexeme.Semantic{{{inner}}}'
	# def __str__(self):
	# 	pass
Base = LexemeSemantic


# items

class Number(Base):
	class BasicFloat(Base):
		value = 0

class String(Base):
	parts = None # []

class Id(Base):
	text = None # ""
	def _repr_extra(self):
		return [f'text: "{repr(self.text)[1:-1]}"']
	@classmethod
	def with_text(cls, text):
		s = cls()
		s.text = text
		return s

	class Strip(Base):
		parts = None # []
		def _repr_extra(self):
			return [f'({", ".join([repr(p) for p in self.parts])})']



if __name__ == '__main__':
	# test
	pass
