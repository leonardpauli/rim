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


class TokenizeContext(Token): # ie. "non-terminal"
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

class Digit(TokenRegex):
	pattern = re.compile(r'\d')

	class Zero(Token):
		pattern = "0"


# tokens

class Indent(TokenizeContext):
	class Tab(Token):
		pattern = "\t"
	class Space2(Token):
		pattern = "  "
	pattern = Option(Many(Or(Tab, Space2)))


class Comment:
	class Top(TokenizeContext):
		class Start(Token):
			pattern = "#"
		class Hashbang(TokenizeContext):
			class Start(Token):
				pattern = "!"
			pattern = And(Start, Str)
		class Body(TokenizeContext):
			pattern = And(Option(Space), Option(Many(Or(Space.White, Comment.Line, String, Char))))
		pattern = And(Start, Or(Hashbang, Body))

	class Line(TokenizeContext):
		class Start(Token):
			pattern = "//"
		pattern = And(Start, Option(Expression), Option(Space.White), Option(Str))

	class Block(TokenizeContext):
		class Start(Token):
			pattern = "'"
		pattern = And(Start, Option(Or(And(Space, Option(Str)), Expression)))


class Line(TokenizeContext):
	pattern = And(Indent, Option(Space.White), Or(Comment.Top, Comment.Block, Expression), Option(Space.White), Option(Comment.Line))

class File(TokenizeContext):
	pattern = Option(Many(Line))


class Expression(TokenizeContext):
	class Operant(TokenizeContext):
		pattern = Element
	pattern = Many(Or(Space.White, Id.Special, Element))


class String(TokenizeContext):
	class Start(Token):
		pattern = '"'
	class End(Token):
		pattern = '"'
	class Escape(TokenizeContext):
		class Start(Token):
			pattern = '\\'
		pattern = And(Start, Option(Or(Start, End, Expression)))
	pattern = And(Start, Option(Many(Or(Escape, Char))), Option(End))


class Number(TokenizeContext):
	class Spacing(Token):
		pattern = "_"
	class LeadingZeros(TokenizeContext):
		pattern = And(Digit.Zero, Option(Many(Or(Digit.Zero, Spacing))))
	class Whole(TokenizeContext):
		pattern = And(Or(LeadingZeros, Digit), Option(Many(Or(Digit, Spacing))))
	class Decimal(TokenizeContext):
		class Dot(Token):
			pattern = "."
		pattern = And(Dot, Many(Or(Digit, Spacing)))

	# 000 52_300 . 322_000
	pattern = And(Whole, Option(Decimal))


class Group(TokenizeContext):
	@staticmethod
	def patternForEndTokens(Start, End):
		return And(Start, Option(Space.White), Option(Or(Expression, Id.Strip)), Option(Space.White), Option(End))
	
	class Paren(TokenizeContext):
		class Start(Token):
			pattern = "("
		class End(Token):
			pattern = ")"
		pattern = Group.patternForEndTokens(Start, End)

	class Brace(TokenizeContext):
		class Start(Token):
			pattern = "{"
		class End(Token):
			pattern = "}"
		pattern = Group.patternForEndTokens(Start, End)

	class Bracket(TokenizeContext):
		class Start(Token):
			pattern = "["
		class End(Token):
			pattern = "]"
		pattern = Group.patternForEndTokens(Start, End)



class Element(TokenizeContext):
	class Part(TokenizeContext):
		pattern = Or(String, Group, Number, Id)
	pattern = Many(Part)

class Id(TokenizeContext):
	class Strip(TokenizeContext):
		class Dot(Token):
			pattern = "."
		class Item(TokenizeContext):
			pattern = Element
		pattern = And(Option(Dot), Item, Option(Many(And(Dot, Item))))

	class Special(TokenizeContext):
		class Char(Token):
			@classmethod
			def match(cls, linestr, start=0):
				if start >= len(linestr): return None
				l = linestr[start:1]
				c = ord(l)
				# if c < 0xC0

				if linestr.startswith(p, start):
					end = start + len(p)
					return cls(start, end)
				return None
		pattern = Many(Char)








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
