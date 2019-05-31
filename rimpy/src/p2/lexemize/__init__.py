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

	linestr = '7342'
	token = tokenize.Number.match(linestr)
	syntax = Syntax.Number.with_token(token)
	lexeme = syntax.to_semantic()
	assert lexeme.value==7342
	syntax = Syntax.from_semantic(lexeme)
	assert str(syntax) == '7342'

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

	
	# id.strip MVP

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

	
	# str MVP
	
	linestr = r'"hello\"1"'
	token = tokenize.String.match(linestr)
	syntax = Syntax.String.with_token(token)
	# print(repr(syntax))
	assert repr(syntax) == r'Lexeme.Syntax{is String, 0..10, ("hello", Lexeme.Syntax{is Escape, 6..8, ('"'\"'"')}, "1")}'
	lexeme = syntax.to_semantic()
	# print(repr(lexeme))
	assert repr(lexeme) == r'Lexeme.Semantic{is String, ("hello"1")}'
	assert lexeme.parts[0] == 'hello"1'
	lexeme.parts[0] += '"lal'
	lexeme.parts.append('2')
	lexeme.parts.append(semantic.Number.BasicFloat.with_value(3.7))
	syntax = Syntax.from_semantic(lexeme)
	# print(str(syntax))
	assert str(syntax)==r'"hello\"1\"lal23.7"'
	

	# group MVP
	
	linestr = r'( {[ b} )'
	token = tokenize.Group.match(linestr)
	syntax = Syntax.Group.with_token(token)
	# print(repr(syntax))
	assert repr(syntax) == r'Lexeme.Syntax{is Group, 0..9, kind: paren, space.start: " ", space.end: " ", (Lexeme.Syntax{is Group, 2..7, kind: brace, (Lexeme.Syntax{is Group, 3..6, kind: bracket, not closed, space.start: " ", (Lexeme.Syntax{is Id, 5..6, text: "b"})})})}'
	lexeme = syntax.to_semantic()
	# print(repr(lexeme))
	assert repr(lexeme) == r'Lexeme.Semantic{is Group, kind: paren, (Lexeme.Semantic{is Group, kind: brace, (Lexeme.Semantic{is Group, kind: bracket, not closed, (Lexeme.Semantic{is Id, text: "b"})})})}'
	assert lexeme.kind.name == "paren"
	# lexeme.some = changed
	syntax = Syntax.from_semantic(lexeme)
	# print(str(syntax))
	assert str(syntax)==r'( {[ b} )'
	lexeme.value.value.closed = True
	# print(repr(lexeme))
	syntax = Syntax.from_semantic(lexeme)
	syntax.value.value.space_start = None
	# print(repr(syntax))
	# print(str(syntax))
	assert str(syntax)==r'( {[b]} )'
	
	
	# attach MVP
	
	linestr = r'a{b}'
	token = tokenize.Expression.match(linestr)
	syntax = Syntax.Expression.with_token(token)
	# print(repr(syntax))
	assert repr(syntax) == r'Lexeme.Syntax{is Attach, target: Lexeme.Syntax{is Id, 0..1, text: "a"}, (Lexeme.Syntax{is Group, 1..4, kind: brace, (Lexeme.Syntax{is Id, 2..3, text: "b"})})}'
	lexeme = syntax.to_semantic()
	# print(repr(lexeme))
	assert repr(lexeme) == r'Lexeme.Semantic{is Attach, target: Lexeme.Semantic{is Id, text: "a"}, (Lexeme.Semantic{is Group, kind: brace, (Lexeme.Semantic{is Id, text: "b"})})}'
	assert lexeme.target.text == 'a'
	
	syntax = Syntax.from_semantic(lexeme)
	# print(str(syntax))
	assert str(syntax)==r'a{b}'

	lexeme.target = semantic.Id.Strip.with_parts([lexeme.target, semantic.Id.with_text('c')])
	syntax = Syntax.from_semantic(lexeme)
	# print(str(syntax))
	assert str(syntax)==r'(a.c){b}'
	
	
	# bind MVP
	
	# add 3 4 -> add (3 4) -> add ((,)(3)(4)) -> add((,)(3)(4))
	# -> add(3)(4) -> (add(3))(4)
	linestr = r'add(3 )(4)'
	token = tokenize.Expression.match(linestr)
	syntax = Syntax.Expression.with_token(token)
	# print(repr(syntax))
	assert repr(syntax) == r'Lexeme.Syntax{is Bind, kind: prefix, target: Lexeme.Syntax{is Bind, kind: prefix, target: Lexeme.Syntax{is Id, 0..3, text: "add"}, (Lexeme.Syntax{is Group, 3..7, kind: paren, space.end: " ", (Lexeme.Syntax{is Number, 4..5, ("3", "")})})}, (Lexeme.Syntax{is Group, 7..10, kind: paren, (Lexeme.Syntax{is Number, 8..9, ("4", "")})})}'	
	lexeme = syntax.to_semantic()
	# print(repr(lexeme))
	assert repr(lexeme) == r'Lexeme.Semantic{is Bind, kind: prefix, target: Lexeme.Semantic{is Bind, kind: prefix, target: Lexeme.Semantic{is Id, text: "add"}, (Lexeme.Semantic{is Group, kind: paren, (Lexeme.Semantic{is BasicFloat})})}, (Lexeme.Semantic{is Group, kind: paren, (Lexeme.Semantic{is BasicFloat})})}'
	assert lexeme.values[0].value.value == 4

	syntax = Syntax.from_semantic(lexeme)
	# print(str(syntax))
	assert str(syntax)==r'add(3 )(4)'

	syntax = Syntax.from_semantic(lexeme)
	syntax.target.values[0].space_end = None
	# print(str(syntax))
	assert str(syntax)==r'add(3)(4)'

	"""
	# expression WIP

	linestr = '3+ 2'
	token = tokenize.Expression.match(linestr)
	syntax = Syntax.Expression.with_token(token, skip_grouping=True)
	# print(repr(syntax))
	assert repr(syntax) == r'Lexeme.Syntax{is Expression, 0..4, (Lexeme.Syntax{is Number, 0..1, ("3", "")}, Lexeme.Syntax{is Id, 1..2, special, space.after: " ", text: "+"}, Lexeme.Syntax{is Number, 3..4, ("2", "")})}'
	
	# lexeme = syntax.to_semantic(skip_grouping=True)
	# print(repr(lexeme))
	# assert repr(lexeme) == r'Lexeme.Semantic{is Expression, ("3", "+", " ", "2")}' # though with many Lexeme.Semantic
	pass


	# binding wip

	# linestr = 'add(4)(5)'
	# token = tokenize.Expression.match(linestr)
	# syntax = Syntax.Expression.with_token(token, skip_grouping=True)
	# print(repr(syntax))


	
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
