# lib/aster
# lpasm
# created by Leonard Pauli, 27 mar 2019
#

""" # usage example
# myaster.py
from math import inf
from aster import * # ASTNode, ASTLiteral, ASTToken, ASTRepeat, ASTOptional, ASTAnd, ASTOr
from mytokenizer import *


# ast value nodes

class ASTValueId():
	def __init__(self, name):
		self.name = name

class ASTValueOperator():
	def __init__(self, isminus = False):
		self.isminus = isminus

class ASTValueOperation():
	def __init__(self, operator, left, right):
		self.operator = operator
		self.left = left
		self.right = right
	def eval(self):
		left = self.left.eval() if isinstance(self.left, ASTValueOperation) else self.left
		right = self.right.eval() if isinstance(self.right, ASTValueOperation) else self.right
		if self.operator.isminus:
			return left-right
		else:
			return left+right


# ast nodes custom

class ASTId(ASTNode):
	def astify(self, tokens):
		return ASTToken(TokenId).astify(tokens)

class ASTOperator(ASTNode):
	@classmethod
	def setup(cls):
		cls.node = ASTOr([ASTLiteral("+"), ASTLiteral("-")])
	def astify(self, tokens):
		(val, resttokens, ok) = self.__class__.node.astify(tokens)
		if not ok: return (None, tokens, False)
		val = ASTValueOperator(isminus=val=='-')
		return (val, resttokens, True)

class ASTExpression(ASTNode):
	@classmethod
	def setup(cls):
		cls.node = ASTAnd([ASTId(), ASTRepeat(ASTAnd([ASTOperator(), ASTId()]), 0, inf)])
	def astify(self, tokens):
		(val, resttokens, ok) = self.__class__.node.astify(tokens)
		if not ok: return (None, tokens, False)
		(head, tail) = val
		node = head
		if tail:
			for operator, right in tail:
				node = ASTValueOperation(operator, node, right)
		return node
	

# setup cross-dependencies
ASTOperator.setup()
ASTExpression.setup()


# myparser
from mytokenizer import tokenizeExpression as tokenize
from myaster import ASTExpression

def parse(text, data):
	tokens = list(tokenize())
	(ast, resttokens, ok) = ASTExpression().astify(tokens)
	if not ok: raise ValueError(f'not matching the tokens {ast} {tokens}')
	if len(resttokens): raise SyntaxError(f'got resttokens:\n{resttokens}')
	return astToInt(ast, data)

def astToInt(ast, data):
	if not isinstance(ast, ASTExpression):
		raise ValueError('expected ASTExpression')
	return ast.node.eval()

parse("a +sum -  b", {'a': 1, 'sum': 7, 'b': 3}) # 5
"""


from .tokenizer import TokenLiteral


# ast node bases

class ASTNode():
	def astify(self, tokens):
		(val, resttokens, ok) = self.__class__.node.astify(tokens)
		if not ok: return (None, tokens, False)
		return (val, resttokens, True)
	# def astify(self, tokens):
	# 	raise ValueError(f'{self.__class__.__name__}.astify not implemented')
		# return (self/None, restTokens/[], matched/True/False) // eg. (None, ..., True) if optional but no match

class ASTLiteral(ASTNode):
	def __init__(self, char):
		self.char = char
	def astify(self, tokens):
		if not len(tokens): return (None, [], False)
		t = tokens[0]
		if isinstance(t, TokenLiteral) and t.raw == self.char:
			return (t.raw, tokens[1:], True)
		return (None, tokens, False)

class ASTToken(ASTNode):
	def __init__(self, tokenType):
		self.tokenType = tokenType
	def astify(self, tokens):
		t = tokens[0]
		if isinstance(t, self.tokenType):
			return (t.raw, tokens[1:], True)
		return (None, tokens, False)

class ASTRepeat(ASTNode):
	def __init__(self, node, repeatCountMin = 1, repeatCountMax = 1):
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

class ASTOptional(ASTNode):
	def __init__(self, node):
		self.node = node
	def astify(self, tokens):
		(val, resttokens, ok) = self.node.astify(tokens)
		if not ok: return (None, tokens, True)
		return (val, resttokens, True)

class ASTAnd(ASTNode):
	def __init__(self, nodes):
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

class ASTOr(ASTNode):
	def __init__(self, nodes):
		self.nodes = nodes
	def astify(self, tokens):
		matches = []
		for node in self.nodes:
			(val, resttokens, ok) = node.astify(tokens)
			if ok:
				return (val, resttokens, True)
		return (None, tokens, False)
