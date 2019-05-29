# lexemize/__init__.py
# rimpy/p2
# created by Leonard Pauli, 21 may 2019

from . import syntax as Syntax
from . import semantic


# test: cd rimpy && py -m src.p2.lexemize.__init__
if __name__ == '__main__':
	from .. import tokenize


	# Number

	# syntax -> semantic + change -> back
	linestr = '036_132.732_223_0'
	token = tokenize.Number.match(linestr)
	# [print(t) for t in token.endterminals()]
	syntax = Syntax.Number.with_token(token)
	# print(repr(syntax))
	assert repr(syntax) == 'Lexeme.Syntax{is Number, 0..17, spacers_every3, precision_decimal_min: 7, ("036132", "7322230")}'
	lexeme = syntax.to_semantic()
	# print(lexeme.value)
	assert lexeme.value==36132.732223
	lexeme.value += 1111.22
	syntax = Syntax.from_semantic(lexeme)
	# print(repr(syntax))
	# print(syntax)
	assert str(syntax) == '037_243.952_223_0'
	syntax.positions_whole_min = 0
	syntax.precision_decimal_min = 0
	syntax.spacers_every3 = False
	assert str(syntax) == '37243.952223'
	# # lexeme.dirty()
	# syntax.delta_update_get()


	# id.special

	linestr = '+'
	token = tokenize.Id.Special.match(linestr)
	syntax = Syntax.Id.with_token(token)
	# print(repr(syntax))
	assert repr(syntax) == 'Lexeme.Syntax{is Id, 0..1, special, text: "+"}'
	lexeme = syntax.to_semantic()
	# print(repr(lexeme))
	assert repr(lexeme) == 'Lexeme.Semantic{is Id, text: "+"}' # special
	assert lexeme.text == '+' # and lexeme.special
	lexeme.text = '*'
	syntax = Syntax.from_semantic(lexeme)
	assert str(syntax) == '*'

	
	# id.strip WIP

	linestr = 'a.b.1'
	token = tokenize.Id.Strip.match(linestr)
	syntax = Syntax.Id.Strip.with_token(token)
	# print(repr(syntax))
	assert repr(syntax) == r'Lexeme.Syntax{is Strip, 0..5, (Lexeme.Syntax{is Id, 0..1, text: "a"}, Lexeme.Syntax{is Id, 2..3, text: "b"}, Lexeme.Syntax{is Number, 4..5, ("1", "")})}'
	lexeme = syntax.to_semantic()
	# print(repr(lexeme))
	assert repr(lexeme)==r'Lexeme.Semantic{is Strip, (Lexeme.Semantic{is Id, text: "a"}, Lexeme.Semantic{is Id, text: "b"}, Lexeme.Semantic{is BasicFloat})}'
	assert lexeme.parts[0].text == "a"
	lexeme.parts.pop()
	lexeme.parts.append(semantic.Id.with_text("c"))
	lexeme.parts.append(semantic.Id.with_text("d"))
	# print(str(lexeme.syntax))
	syntax = Syntax.from_semantic(lexeme)
	# print(str(syntax))
	assert str(syntax)=='a.b.c.d'


	# str WIP
	"""
	linestr = '"hello"'
	pass


	# expression WIP

	linestr = '3+ 2'
	token = tokenzie.Expression.match(linestr)
	syntax = Syntax.Expression.with_token(token, skip_grouping=True)
	print(repr(syntax))
	assert repr(syntax) == r'Lexeme.Syntax{is Expression, 0..4, ("3", "+", " ", "2")}' # though with many Lexeme.Syntax
	
	# lexeme = syntax.to_semantic(skip_grouping=True)
	# print(repr(lexeme))
	# assert repr(lexeme) == r'Lexeme.Semantic{is Expression, ("3", "+", " ", "2")}' # though with many Lexeme.Semantic
	pass


	# expression grouping
	
	linestr = '3+ 2+4'
	# Lexeme.Syntax{is Bind, fn: Lexeme.Syntax{is Id, 4..5, is special, ("+")},
	# 	left: Lexeme.Syntax{is Bind, fn: Lexeme.Syntax{is Id, 1..2, is special, ("+")},
	# 		left: Lexeme.Syntax{is Number, 0..1, ("3")},
	# 		space_left: None, space_right: " ",
	# 		right: [Lexeme.Syntax{is Number, 3..4, ("2")}]},
	# 	space_left: None, space_right: None,
	# 	right: [Lexeme.Syntax{is Number, 5..6, ("4")}]}
	pass


	# test reduced

	def reduced_syntax_test(what, linestr, target):
		token = tokenize.Expression.match(linestr)
		syntax = Syntax.Expression.with_token(token)
		lexeme = syntax.to_semantic()
		lexeme.reduced_calc()
		reduced = Syntax.from_semantic(lexeme.reduced)
		if str(reduced)!=target:
			raise ValueError(f'{what}: \n\t{str(reduced)}!={target}; \n\t{repr(reduced)}') 

	reduced_syntax_test('a+3*2', 'a + 6')
	reduced_syntax_test("paren", r'3+2*(5-1)+7', r'18')
	reduced_syntax_test("str interpolation", r'"1+2=\(1+2)"', r'"1+2=3"')
	"""

	# done
	print('success')
