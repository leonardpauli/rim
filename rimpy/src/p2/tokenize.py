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



# declare

class Expression(TokenizeContext): pass

class Element(TokenizeContext):
	class Part(TokenizeContext): pass
	pattern = Many(Part)



# comment

class Comment:
	class Top(TokenizeContext):
		class Start(Token):
			pattern = "#"
		class Hashbang(TokenizeContext):
			class Start(Token):
				pattern = "!"
			pattern = And(Start, Str)
		class Body(TokenizeContext): pass
		pattern = And(Start, Or(Hashbang, Body))

	class Line(TokenizeContext):
		class Start(Token):
			pattern = "//"
		pattern = And(Start, Option(Element), Option(Space.White), Option(Str))

	class Block(TokenizeContext):
		class Start(Token):
			pattern = "'"
		pattern = And(Start, Option(Or(And(Space, Option(Str)), Element)))



# file/line

class Line(TokenizeContext):
	pattern = And(Indent, Option(Space.White), Or(Comment.Top, Comment.Block, Expression), Option(Space.White), Option(Comment.Line))

# Logic for tokenizing whole file elsewhere
# class File(TokenizeContext):
# 	pattern = Option(Many(Line))



# primitives

class String(TokenizeContext):
	class Start(Token):
		pattern = '"'
	class End(Token):
		pattern = '"'
	class Escape(TokenizeContext):
		class Start(Token):
			pattern = '\\'
	class Char(Token):
		@classmethod
		def match(cls, linestr, start=0):
			if start >= len(linestr): return None
			l = linestr[start]
			if l == String.End.pattern: return None
			return cls(start, start+1)

String.pattern = And(String.Start, Option(Many(Or(String.Escape, String.Char))), Option(String.End))
String.Escape.pattern = And(String.Escape.Start, Option(Or(String.Escape.Start, String.End, Element)))


class Number(TokenizeContext):
	class Spacing(Token):
		pattern = "_"
	class LeadingZeros(TokenizeContext): pass
	class Whole(TokenizeContext): pass
	class Decimal(TokenizeContext):
		class Dot(Token):
			pattern = "."

	# 000 52_300 . 322_000
	pattern = And(Whole, Option(Decimal))

Number.LeadingZeros.pattern = And(Digit.Zero, Option(Many(Or(Digit.Zero, Number.Spacing))))
Number.Whole.pattern = And(Or(Number.LeadingZeros, Digit), Option(Many(Or(Digit, Number.Spacing))))
Number.Decimal.pattern = And(Number.Decimal.Dot, Many(Or(Digit, Number.Spacing)))



# group


class Group(TokenizeContext):
	@staticmethod
	def setPattern(cls):
		cls.pattern = And(cls.Start, Option(Space.White), Option(Or(Expression, Id.Strip)), Option(Space.White), Option(cls.End))

	class Paren(TokenizeContext):
		class Start(Token):
			pattern = "("
		class End(Token):
			pattern = ")"

	class Brace(TokenizeContext):
		class Start(Token):
			pattern = "{"
		class End(Token):
			pattern = "}"

	class Bracket(TokenizeContext):
		class Start(Token):
			pattern = "["
		class End(Token):
			pattern = "]"

	pattern = Or(Paren, Brace, Bracket)



# id

class Id(TokenizeContext):
	class Strip(TokenizeContext):
		class Dot(Token):
			pattern = "."
		class Item(TokenizeContext): pass
		pattern = And(Option(Dot), Item, Option(Many(And(Dot, Item))))

	class Special(TokenizeContext):
		class Char(Token):
			@classmethod
			def is_special_symbol_char(cls, l):
				"""
				TODO: might not be precise, not so black n white
				goal: a special symbol may act as a word separator,
					thus, should not be a "letter", though seemed easier to define it as all
					unicode chars in "unicode symbol blocks" except eg. emojis and some
					letters that happend to be there?
				"""
				c = ord(l)
				if c < 0xC0:
					for r in ('_$ "(){}[]', 'ŠŒŽšœžŸ'):
						if l in r: return False
					for r in (range(0x30, 0x39+1), range(0x41, 0x5A+1), range(0x61, 0x7A+1)):
						if c in r: return False
					return True
				# symbols
				if c in range(0x2000, 0x2800):
					for r in ("⌚⌛", "⏩⏪⏫⏬⏭⏮⏯⏰⏱⏲⏳⏴⏵⏶⏷⏸⏹⏺", "☄☔☕☘☝☠☢☣☦☪☮☯☸♈♉♊♋♌♍♎♏♐♑♒♓♿⚒⚓⚔⚕⚖⚗⚙⚛⚜⚡⚪⚫⚰⚱⚽⚾⛄⛅⛈⛎⛏⛑⛓⛔⛩⛪⛰⛱⛲⛳⛴⛵⛷⛸⛹⛺⛽✅✊✋✌✍✨❌❎❓❔❕❗➕➖➗➰➿"):
						if l in r: return False
					return True
				if c in range(0x2900, 0x2c00):
					for r in ("⬛⭐⭕"):
						if l in r: return False
					return True
				if c in range(0x3000, 0x3040): True
				return False

			@classmethod
			def match(cls, linestr, start=0):
				if start >= len(linestr): return None
				if linestr.startswith('//', start): return None
				l = linestr[start]
				return cls(start, start+1) if cls.is_special_symbol_char(l) else None

		pattern = Many(Char)


	class Base(Token):
		allowed_chars = '_$'
		disallowed_chars = '(){}[]" \t/'
		disallowedTokens = [] # see below

		@classmethod
		def match(cls, linestr, start=0):
			if start >= len(linestr): return None
			l = linestr[start]
			if l in cls.allowed_chars:
				pass
			elif l in cls.disallowed_chars:
				return None
			else:
				v, r, ok = match(Or(*cls.disallowedTokens), (linestr, start))
				if ok: return None
			return cls(start, start+1)

	class Start(Base): pass
	class Middle(Base): pass
	class Tail(TokenizeContext): pass

	pattern = And(Start, Option(Tail))

Id.Base.disallowedTokens = [Id.Special]
Id.Start.disallowedTokens = Id.Base.disallowedTokens+[Digit]
Id.Middle.allowed_chars = Id.Base.allowed_chars+'-'
Id.Middle.disallowedTokens = Id.Base.disallowedTokens
Id.Tail.pattern = Or(And(Id.Middle, Id.Tail), Id.Base)



# bind declared

Comment.Top.Body.pattern = And(Option(Space), Option(Many(Or(Space.White, Comment.Line, String, Char))))
Expression.pattern = Many(Or(Space.White, Id.Special, Element))
Element.Part.pattern = Or(String, Group, Number, Id.Strip)
Id.Strip.Item.pattern = Or(String, Group, Number, Id)
Element.pattern = Element.Part.pattern

Group.setPattern(Group.Paren)
Group.setPattern(Group.Brace)
Group.setPattern(Group.Bracket)


# test

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

	s = '33.126_200'
	a = Number.match(s)
	assert a is not None
	# print(a.repr_unfolded(s))

	s = r'"hello \"name\""'
	a = String.match(s)
	assert a is not None
	# print(a.repr_unfolded(s))
	
	s = r'abc_de'
	a = Id.match(s)
	assert a is not None
	# print(a.repr_unfolded(s))
	
	s = r'*'
	a = Id.Special.match(s)
	assert a is not None
	# print(a.repr_unfolded(s))
	
	s = r'a'
	a = Id.Strip.match(s)
	assert a is not None
	# print(a.repr_unfolded(s))
	
	s = r'a.b."c".d.0'
	a = Id.Strip.match(s)
	assert a is not None
	# print(a.repr_unfolded(s))
	
	s = r'(a)'
	a = Expression.match(s)
	assert a is not None
	# print(a.repr_unfolded(s))

	s = r'3 * 5 +2/(a.b + "lal")'
	a = Expression.match(s)
	assert a is not None
	# print(a.repr_unfolded(s))

	s = r'	  	 a."b\t".k{d: x+y*(3-1); some}.c(e) f g // hello'
	a = Line.match(s)
	assert a is not None
	# print(a.repr_unfolded(s))

	s = r'#!/usr/bin/env rim'
	a = Line.match(s)
	assert a is not None
	# print(a.repr_unfolded(s))

	s = r"' comment // line" # todo: add separation of line-comments in block-comments
	a = Line.match(s)
	assert a is not None
	# print(a.repr_unfolded(s))

	print('success')
