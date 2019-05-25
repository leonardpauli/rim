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
	lexeme = syntaxLexeme.to_semantic()
	# print(lexeme.value)
	assert lexeme.value==36132.732223
	lexeme.value += 1111.22
	syntaxLexeme2 = syntaxLexeme.copy_with_semantic(lexeme)
	# print(repr(syntaxLexeme2))
	# print(syntaxLexeme2)
	assert str(syntaxLexeme2) == '037_243.952_223_0'
	syntaxLexeme2.positions_whole_min = 0
	syntaxLexeme2.precision_decimal_min = 0
	syntaxLexeme2.spacers_every3 = False
	assert str(syntaxLexeme2) == '37243.952223'
	# # lexeme.dirty()
	# syntaxLexeme.delta_update_get()
	# 
	print('success')
