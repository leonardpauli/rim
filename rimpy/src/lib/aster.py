# lib/aster
# lpasm
# created by Leonard Pauli, 27 mar 2019
#

""" # usage example
# myaster.py
from math import inf
from aster import * # Node, Literal, Token, Repeat, Optional, And, Or
from mytokenizer import *


# ast value nodes

class ValueId():
	def __init__(self, name):
		self.name = name

class ValueOperator():
	def __init__(self, isminus = False):
		self.isminus = isminus

class ValueOperation():
	def __init__(self, operator, left, right):
		self.operator = operator
		self.left = left
		self.right = right
	def eval(self):
		left = self.left.eval() if isinstance(self.left, ValueOperation) else self.left
		right = self.right.eval() if isinstance(self.right, ValueOperation) else self.right
		if self.operator.isminus:
			return left-right
		else:
			return left+right


# ast nodes custom

class Id(Node):
	def astify(self, tokens):
		return Token(TokenId).astify(tokens)

class Operator(Node):
	@classmethod
	def setup(cls):
		cls.node = Or(Literal("+"), Literal("-"))
	def astify(self, tokens):
		(val, resttokens, ok) = self.__class__.node.astify(tokens)
		if not ok: return (None, tokens, False)
		val = ValueOperator(isminus=val=='-')
		return (val, resttokens, True)

class Expression(Node):
	@classmethod
	def setup(cls):
		cls.node = And(Id(), Repeat(0, inf, And(Operator(), Id())))
	def astify(self, tokens):
		(val, resttokens, ok) = self.__class__.node.astify(tokens)
		if not ok: return (None, tokens, False)
		(head, tail) = val
		node = head
		if tail:
			for operator, right in tail:
				node = ValueOperation(operator, node, right)
		return node
	

# setup cross-dependencies
Operator.setup()
Expression.setup()


# myparser
from mytokenizer import tokenizeExpression as tokenize
from myaster import Expression

def parse(text, data):
	tokens = list(tokenize())
	(ast, resttokens, ok) = Expression().astify(tokens)
	if not ok: raise ValueError(f'not matching the tokens {ast} {tokens}')
	if len(resttokens): raise SyntaxError(f'got resttokens:\n{resttokens}')
	return astToInt(ast, data)

def astToInt(ast, data):
	if not isinstance(ast, Expression):
		raise ValueError('expected Expression')
	return ast.node.eval()

parse("a +sum -  b", {'a': 1, 'sum': 7, 'b': 3}) # 5
"""


from .tokenizer import TokenLiteral


# ast node bases

class Node():
	def astify(self, tokens):
		(val, resttokens, ok) = self.__class__.node.astify(tokens)
		if not ok: return (None, tokens, False)
		return (val, resttokens, True)
	# def astify(self, tokens):
	# 	raise ValueError(f'{self.__class__.__name__}.astify not implemented')
		# return (self/None, restTokens/[], matched/True/False) // eg. (None, ..., True) if optional but no match

class Literal(Node):
	def __init__(self, char):
		self.char = char
	def astify(self, tokens):
		if not len(tokens): return (None, [], False)
		t = tokens[0]
		if isinstance(t, TokenLiteral) and t.raw == self.char:
			return (t.raw, tokens[1:], True)
		return (None, tokens, False)

class Token(Node):
	def __init__(self, tokenType):
		self.tokenType = tokenType
	def astify(self, tokens):
		t = tokens[0]
		if isinstance(t, self.tokenType):
			return (t.raw, tokens[1:], True)
		return (None, tokens, False)

class Repeat(Node):
	def __init__(self, repeatCountMin = 1, repeatCountMax = 1, node):
		self.node = node
		self.repeatCountMin = repeatCountMin
		self.repeatCountMax = repeatCountMax
	def astify(self, tokens):
		matches = []
		resttokens = tokens
		while len(resttokens) and len(matches) < self.repeatCountMax:
			(val, _resttokens, ok) = self.node.astify(resttokens)
			if not ok: break
			resttokens = _resttokens
			matches.append(val)

		if len(matches) >= self.repeatCountMin:
			return (matches, resttokens, True)
		return (None, tokens, False)

class Optional(Node):
	def __init__(self, node):
		self.node = node
	def astify(self, tokens):
		(val, resttokens, ok) = self.node.astify(tokens)
		if not ok: return (None, tokens, True)
		return (val, resttokens, True)

class And(Node):
	def __init__(self, *nodes):
		self.nodes = nodes
	def astify(self, tokens):
		matches = []
		resttokens = tokens
		for node in self.nodes:
			(val, resttokens, ok) = node.astify(resttokens)
			if not ok:
				return (None, tokens, False)
			matches.append(val)
		if not len([m for m in matches if m!=None]):
			return (None, tokens, False)
		return (matches, resttokens, True)

class Or(Node):
	def __init__(self, *nodes):
		self.nodes = nodes
	def astify(self, tokens):
		matches = []
		for node in self.nodes:
			(val, resttokens, ok) = node.astify(tokens)
			if ok:
				return (val, resttokens, True)
		return (None, tokens, False)
