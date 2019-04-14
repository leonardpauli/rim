# lib/tokenizer
# lpasm
# created by Leonard Pauli, 27 mar 2019
#

""" # usage example
import re
from tokenizer import Token, TokenLiteral as TokenLiteralBase, tokenize

class TokenId(Token):
	regex = re.compile(r'^[A-Za-z][A-Za-z0-9]*')
class TokenSpace(Token):
	regex = re.compile(r'^ +')
class TokenLiteral(TokenLiteralBase):
	literals = ['+', '-']

tokenTypes = [TokenId, TokenSpace, TokenLiteral]
tokenTypesDiscard = [TokenSpace]

def tokenizeExpression(text):
	yield from tokenize(text, tokenTypes, tokenTypesDiscard):

list(tokenizeExpression("a +sum -  b")) # [<TokenId raw: a>, <TokenLiteral raw: +>, <TokenId raw: sum>, <TokenLiteral raw: ->, <TokenId raw: b>]

"""

""" TODO: tokenize contexts

Context
	tokenTypes
	tokenTypesDiscard

Token
	match (text, start_index): Empty or (Token, start_index_new, ctx_to_pop_len, ctx_to_push)
	raw is String
	


"""



def tokenize(text, tokenTypes, tokenTypesDiscard):
	while len(text):
		t, text = nextToken(text, tokenTypes)
		if not t: break
		if not t.__class__ in tokenTypesDiscard:
			yield t
	# return text # TODO: know if fully parsed or not

def nextToken(text, tokenTypes):
	for tt in tokenTypes:
		t, rest = tt.match(text)
		if t: return (t, rest)
	return (None, text)


class Token():
	def __init__(self, raw):
		self.raw = raw
	@classmethod
	def match(cls, text):
		m = cls.regex.match(text)
		if m:
			l = m.span()[1]
			return (cls(text[:l]), text[l:])
		return (None, text)
	def __str__(self):
		return f'[{self.__class__.__name__} "{self.raw}"]'
	def __repr__(self):
		return self.__str__()

class TokenLiteral(Token):
	literals = [] # eg. ['+', '-']
	@classmethod
	def match(cls, text):
		l = text[0]
		if l in cls.literals:
			return (cls(l), text[1:])
		return (None, text)
