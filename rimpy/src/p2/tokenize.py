# tokenize.py
# rimpy/p2
# created by Leonard Pauli, 5 may 2019

import re

from src.lib.match import match, And, Or, Option, Many
from .tokenize_base import *


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
