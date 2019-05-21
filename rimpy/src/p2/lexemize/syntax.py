# lexemize/syntax.py
# rimpy/p2
# created by Leonard Pauli, 21 may 2019

from . import semantic


# base

class LexemeSyntax():
	def __repr__(self):
		return f'Lexeme.Syntax{{is {self.__class__.__name__}}}'

	@classmethod
	def with_token(cls, token):
		pass

Base = LexemeSyntax


# items

class Number(Base):
	wrapper = None # wrapper is Token.Number
	whole_part = [] # whole_part is many Token
	dot = None # dot is Token?
	decimal_part = [] # decimal_part is many Token
	
	@classmethod
	def with_token(cls, token):
		s = cls()
		s.wrapper = token
		return s


if __name__ == '__main__':
	# test
	pass
