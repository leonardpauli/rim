# tokenize_base.py
# rimpy/p2
# created by Leonard Pauli, 5 may 2019

import re
import itertools

from src.lib.match import match, And, Or, Option, Many


class Token:
	def __init__(self, start, end, raw):
		self.start = start
		self.end = end
		self._raw = raw

	@classmethod
	def with_linestr(cls, start, end, linestr):
		return cls(start, end, linestr[start:end])


	def endterminals(self):
		"""returns list of end-terminal tokens (ie. tokens containing chars, not other tokens)"""
		return [self]

	def raw(self):
		"""returns corresponding source string (set at match)"""
		return self._raw

		

	def __repr__(self):
		return f'Token{{is {self.__class__.__name__}, {self.start}..{self.end}}}'

	def repr_w_linestr(self, linestr):
		return f'{self.__class__.__name__} {repr(self.raw(linestr))}'

	def repr_unfolded(self, linestr, indent=0):
		pre = ''.join([' ' for _ in range(0, self.start)])
		mid = self.raw()
		post = ''.join([' ' for _ in range(0, len(linestr)-len(mid)-len(pre))])
		ind = ''.join(['  ' for _ in range(0, indent)])
		return pre+mid+post+f' | {ind}{self.__class__.__name__}'


	def next_ctx(self, ctx):
		return ctx # or TokenizationContext to push

	pattern = None # str

	@classmethod
	def match(cls, linestr, start=0):
		p = cls.pattern
		if linestr.startswith(p, start):
			end = start + len(p)
			return cls.with_linestr(start, end, linestr)
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
		return cls.with_linestr(start, m.span()[1], linestr) if m else None


class TokenizeContext(Token): # ie. "non-terminal"
	pattern = None # lib.match pattern
	patternMatch = None # populated with tokens when matched according to pattern
	parentContext = None # TokenizeContext

	def __init__(self, start, end, patternMatch):
		super().__init__(start, end, None)
		self.patternMatch = patternMatch


	@staticmethod
	def endterminals_get(value):
		if value is None: return []
		if isinstance(value, Token):
			return value.endterminals()
		if type(value) is list:
			return itertools.chain.from_iterable([TokenizeContext.endterminals_get(t) for t in value])
		raise ValueError(f'unknown value {repr(value)}')

	def endterminals(self):
		return TokenizeContext.endterminals_get(self.patternMatch)

	def raw(self):
		return "".join([a.raw() for a in self.endterminals()])


	def __repr__(self):
		return f'TokenizeContext{{is {self.__class__.__name__}, {self.start}..{self.end}}}'

	def repr_unfolded(self, linestr, indent=0):
		ls = [Token.repr_unfolded(self, linestr, indent), *[t.repr_unfolded(linestr, indent+1) for t in self.unwrap()]]
		return '\n'.join(ls)

	def unwrap(self):
		def unwrap_many(v):
			for v in v:
				if v is None:
					pass
				elif isinstance(v, Token):
					yield v
				elif type(v) is list:
					yield from unwrap_many(v)
				else: raise Exception(f'unwrap unhandled patternMatch {repr(v)}')
		
		yield from unwrap_many([self.patternMatch])
		
	@classmethod
	def process_patternMatch(cls, patternMatch):
		return patternMatch

	@classmethod
	def match(cls, linestr, start=0):
		v, r, ok = match(cls.pattern, (linestr, start))
		if not ok: return None
		_, end = r[0]
		return cls(start, end, cls.process_patternMatch(v))


# tokens.basic

class Char(Token):
	@classmethod
	def match(cls, linestr, start=0):
		return cls.with_linestr(start, start+1, linestr) if start < len(linestr) else None

class Str(Token):
	@classmethod
	def match(cls, linestr, start=0):
		l = len(linestr)
		return cls.with_linestr(start, l, linestr) if start < l else None

class Space(Token):
	pattern = " "
	
	class White(TokenRegex):
		pattern = re.compile(r'[\t ]+')

class Digit(TokenRegex):
	pattern = re.compile(r'\d')

	class Zero(Token):
		pattern = "0"

