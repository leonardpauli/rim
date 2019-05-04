# py -m src.lang_test

def fn(a):
	"""Doubles the value
	n is Number
	result is Number

	>>> fn(1)
	2
	"""
	return a*2

def onlya(s):
	"""
	>>> onlya('asdfasdf')
	'aa'
	"""
	return "".join([l for l in s if l == 'a'])


if __name__ == '__main__':
	import doctest
	doctest.testmod()
	doctest.testfile('lang_test.txt')
