# tokenize.py
# rimpy/p2
# created by Leonard Pauli, 5 may 2019

import re

from src.lib.match import match, And, Or, Option, Many


class Token:
	def __init__(self, start, end):
		# in the context of the line (a token cannot extend past a line)
		self.start = start
		self.end = end

	def raw(self, linestr):
		return linestr[self.start:self.end]

	def __repr__(self):
		return f'Token{{is {self.__class__.__name__}, {self.start}..{self.end}}}'

	def repr_w_linestr(self, linestr):
		return f'{self.__class__.__name__} {repr(self.raw(linestr))}'

	def next_ctx(self, ctx):
		return ctx # or TokenizationContext to push

	pattern = None # str

	@classmethod
	def match(cls, linestr, start=0):
		p = cls.pattern
		if linestr.startswith(p, start):
			end = start + len(p)
			return cls(start, end)
		return None

	@classmethod
	def _match(cls, val):
		if not len(val): return None, [], False
		assert type(val[0]) is tuple
		linestr, start = val[0]
		if start >= len(linestr): return None, val, False
		m = cls.match(linestr, start)
		if m is None: return None, val, False
		return m, [(linestr, m.end)], True


class TokenRegex(Token):
	pattern = None # regex

	@classmethod
	def match(cls, linestr, start=0):
		m = cls.pattern.match(linestr, start)
		return cls(start, m.span()[1]) if m else None


class TokenizeContext(Token):
	pattern = None # lib.match pattern
	patternMatch = None # populated with tokens when matched according to pattern
	parentContext = None # TokenizeContext

	def __init__(self, start, end, patternMatch):
		super().__init__(start, end)
		self.patternMatch = patternMatch

	def __repr__(self):
		return f'TokenizeContext{{is {self.__class__.__name__}, {self.start}..{self.end}}}'

	@classmethod
	def match(cls, linestr, start=0):
		v, r, ok = match(cls.pattern, (linestr, start))
		if not ok: return None
		_, end = r[0]
		return cls(start, end, v)


# tokens.basic

class Char(Token):
	@classmethod
	def match(cls, linestr, start=0):
		return cls(start, start+1) if start < len(linestr) else None

class Str(Token):
	@classmethod
	def match(cls, linestr, start=0):
		l = len(linestr)
		return cls(start, l) if start < l else None

class Space(Token):
	pattern = " "
	
	class White(TokenRegex):
		pattern = re.compile(r'[\t ]+')


# tokens

class Indent(TokenizeContext):
	class Tab(Token):
		pattern = "\t"
	class Space2(Token):
		pattern = "  "
	pattern = Option(Many(Or(Tab, Space2)))









if __name__ == '__main__':
	# import doctest
	# doctest.testmod()
	a = Indent.match('\t')
	assert repr(a) == 'TokenizeContext{is Indent, 0..1}'

	a = Indent.Space2.match('  asdf')
	assert a is not None
	
	linestr = '\t  \t s\t'
	a = Indent.match(linestr)
	assert a.end == 4
	assert len(a.patternMatch) == 3



	print('success')
