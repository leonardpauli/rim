# lexemize/__init__.py
# rimpy/p2
# created by Leonard Pauli, 21 may 2019

from . import syntax
from . import semantic


if __name__ == '__main__':
	from ..tokenize import Number
	# test: cd rimpy && py -m src.p2.lexemize.__init__
	s = '6.7'
	m = Number.match(s)
	print(m)
	print(m.repr_unfolded(s))
	m = syntax.Number.with_token(m)
	print(m)
