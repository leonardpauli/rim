# lexemize/__init__.py
# rimpy/p2
# created by Leonard Pauli, 21 may 2019

from . import syntax
from . import semantic


if __name__ == '__main__':
	from .. import tokenize
	# test: cd rimpy && py -m src.p2.lexemize.__init__
	linestr = '036_132.732_223_0'
	token = tokenize.Number.match(linestr)
	# [print(t) for t in token.endterminals()]
	syntaxLexeme = syntax.Number.with_token(token)
	# print(repr(syntaxLexeme))
	assert repr(syntaxLexeme) == 'Lexeme.Syntax{is Number, 0..17, spacers_every3, precision_decimal_min: 7, ("036132", "7322230")}'
	# lexeme = syntaxLexeme.to_semantic()
	# print(lexeme.value) # 36132.732223
	# lexeme.value += 5
	# # lexeme.dirty()
	# syntaxLexeme.delta_update_get()
