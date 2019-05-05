# match.py
# created by Leonard Pauli, 30 apr 2019
# provides "match"-like functionallity as seen in haskell and rust
# ie. 'val, rest, ok = match(pattern, value)'
# 	where pattern can use And, Or, Option, Many, str, regex, custom matcher (eg. class inheriting Matchable)
# - powerful programming pattern

from math import inf
import re

class Matchable:
	pass
	"""
	TODO: Matchable class doesn't really do anything atm, though nice to indicate dep to match.py

	v/vs: value // the matched+parsed value
	r/rs: rest // items that's left to be matched after the first match
	ok // whether matched ok or not

	// implement as a classmethod or instance method depending on usage; eg.
	pattern = And(MyType, MyOtherType) // use classmethod
	m, rs, ok = match(pattern, someValue)
	if ok: myTypeInstance, myOtherTypeInstance = m // instantiated
	// alt:
	pattern = MyCustomMatchType(42) // use instance method
	m, rs, ok = match(pattern, someValue)
	if ok: someParsedValue = m // depending on what MyConstomMatchType._match_one does

	@classmethod
	def _match_one(cls, val):
		raise ValueError(f'_match_one not implemented in {__cls__.__name__}')
		ok = False
		if ...:
			return cls(...), None, True
		return None, val, False

	@classmethod
	def _match(cls, vals):
		v, r, ok = cls._match_one(vals[0])
		if ok: return v, ([] if r is None else [r]) + vals[1:], ok
		...
		return None, vals, False
	"""



class Option(Matchable):
	def __init__(self, val):
		self.val = val
	def _match(self, val):
		pattern = self.val
		v, r, ok = match(pattern, val)
		return v if ok else None, r, True

class And(Matchable):
	def __init__(self, *xs):
		self.xs = xs
	def _match(self, rs):
		vs, r = [], rs
		for pattern in self.xs:
			v, r, ok = match(pattern, r)
			vs.append(v)
			if not ok: return vs, rs, False
		return vs, r, True

class Or(Matchable):
	def __init__(self, *xs, all=False):
		self.xs = xs
		self.all = all
	def _match(self, rs):
		vs, r, ok = [None for _ in self.xs] if self.all else None, rs, False
		for i, pattern in enumerate(self.xs):
			v, r, ok = match(pattern, r)
			if ok:
				if self.all:
					vs[i] = v
				else:
					vs = v
				break
		return vs, r if ok else rs, ok

class Many(Matchable):
	def __init__(self, x, min=1, max=inf):
		self.x = x
		self.min = min
		self.max = max
		if self.max < 1: raise ValueError(f'max has to be >= 1, was {self.max}')
		if self.max < self.min: raise ValueError(f'max has to be >= min, was {self.max} (min was {self.min})')
	def _match(self, rs):
		vs, r = [], rs
		pattern = self.x
		while len(vs) < self.max:
			v, r, ok = match(pattern, r)
			if not ok: break
			vs.append(v)
		ok = self.min <= len(vs) <= self.max
		return vs, r if ok else rs, ok



# ---


def match(pattern, val):
	if type(val) is list:
		isempty = len(val) == 0
		if not isempty:

			if pattern is None or type(pattern) is str or pattern is str or type(pattern) is re.Pattern:
				v, rs, ok = match(pattern, val[0])
				return v, (rs + val[1:]) if ok else val, ok
		
		matcher = None

		try:
			matcher = pattern._match
		except AttributeError:
			pass
		if matcher: return matcher(val)

		if isempty:
			return None, [], False

		try:
			matcher = pattern._match_one
		except AttributeError:
			pass
		if matcher:
			# if TypeError, was @classmethod before _match_one forgetten?
			# if "TypeError: cannot unpack non-iterable ... object", was "return value, rest, ok" and not just "return value"?
			v, r, ok = matcher(val[0])
			return v, (r if r else []) + val[1:], ok

		raise ValueError(f'pattern {repr(pattern)} has no _match_one or _match')
	else:

		if pattern is None:
			ok = val is None
			return None, [] if ok else [val], ok
		if type(pattern) is str:
			ok = isinstance(val, str) and val.startswith(pattern)
			if not ok: return None, [val], False
			i = len(pattern)
			return pattern, [] if i==len(val) else [val[i:]], True
		if type(pattern) is re.Pattern:
			if not isinstance(val, str):
				return None, [val], False
			m = pattern.match(val)
			if not m: return None, [val], False
			i = m.span()[1]
			return m, [] if i==len(val) else [val[i:]], True

		if type(pattern) is type and isinstance(val, pattern):
			return val, [], True

		matcher = None
		try:
			matcher = pattern._match_one
		except AttributeError:
			pass
		if matcher: return matcher(val)

		try:
			matcher = pattern._match
		except AttributeError:
			pass
		if matcher: return matcher([val])

		raise ValueError(f'pattern {repr(pattern)} has no _match_one or _match')



# ---


if __name__ == '__main__':
	v, rs, ok = match(None, None)
	assert ok
	assert v is None
	assert len(rs) == 0

	v, rs, ok = match(None, [None, None])
	assert ok
	assert v is None
	assert len(rs) == 1

	v, rs, ok = match("hello", "hello there")
	assert ok
	assert v == "hello"
	assert len(rs) == 1
	assert rs[0] == " there"

	v, rs, ok = match(And("hello", " ", "there"), "hello there")
	assert ok
	assert len(v) == 3
	assert "".join(v) == "hello there"
	assert len(rs) == 0

	v, rs, ok = match(And(Many(Or("a", "b", all=True)), "end"), "abaabend")
	assert ok
	assert len(v) == 2
	assert len(rs) == 0
	letters, end = v
	assert end == 'end'
	assert len(letters) == 5
	assert letters[0][0] == 'a'
	assert letters[0][1] == None

	class Indent(Matchable):
		def __init__(self, raw):
			self.raw = raw
		def __repr__(self):
			return f'<{__self__.__class__.__name__} {repr(self.raw)}>'
		@classmethod
		def _match_one(cls, val):
			v, rs, ok = match(Or("\t", "  "), val)
			if not ok: return v, rs, ok
			return cls(v), rs, ok
	class IndentMany(Matchable):
		def __init__(self, indents):
			self.xs = indents
		@classmethod
		def _match_one(cls, val):
			vs, rs, ok = match(Many(Indent), val)
			if not ok: return vs, rs, ok
			return cls(vs), rs, ok

	vs, rs, ok = match(And(IndentMany, Option(str)), "\t  \thello\tthere")
	assert ok
	assert len(rs) == 0
	indents, after = vs
	assert len(indents.xs) == 3
	assert after == "hello\tthere"

	vs, rs, ok = match(And(IndentMany, Option(str)), "\t  \t")
	assert ok
	assert len(rs) == 0
	indents, after = vs
	assert len(indents.xs) == 3
	assert after == None
	assert indents.xs[0].raw == '\t'

	print('success')
