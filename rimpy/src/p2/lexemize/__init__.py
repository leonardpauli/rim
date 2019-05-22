# lexemize/__init__.py
# rimpy/p2
# created by Leonard Pauli, 21 may 2019

from . import syntax
from . import semantic


if __name__ == '__main__':
	from ..tokenize import Number
	# test: cd rimpy && py -m src.p2.lexemize.__init__
	s = '036_132.732_223_0'
	m = Number.match(s)
	print(m)
	print(m.repr_unfolded(s))
	m = syntax.Number.with_token(m)
	print(m, m.wrapper.raw(s))
	m = m.to_semantic(s)
	print(repr(m))

	m = str(m)
	print(m)
	# m = syntax.Number.from_semantic(m, 0)
	# print(m, m.wrapper.raw())
	# m = m.to_semantic(s)
	# print(m)
