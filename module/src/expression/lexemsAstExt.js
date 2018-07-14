// expression/lexemsAstExt.js
// LeonardPauli/rim
//
// Created by Leonard Pauli, mid jul 2018
// Copyright © Leonard Pauli 2018
//
// - lexems Abstract Syntax Tree extensions

import sfo, {log} from 'string-from-object'
import {astify, tokensGroupPrio} from '../parser/aster'
import {astidsExpand, lexemsAstTypesExpand, astidFlags} from '../parser/lexemUtils'
import root from './lexems'

const concat = xxs=> xxs.reduce((a, xs)=> (a.push(...xs), a), [])

const {paren, expr, dot, id, text, num, sp} = root


// astToken declaration

// TODO: what did these exactly do again?
// 	Not used in regexp, but possibly should?
expr.single.astTokenWrapperIs = true
expr.lexems[1].type.astTokenWrapperIs = true
sp.astTokenNot = true
paren.open.astTokenNot = true
paren.close.astTokenNot = true
text.open.astTokenNot = true
text.close.astTokenNot = true


// astValueGet definitions

paren.astValueGet = (ctx, t)=> {
	const exprt = t.tokens.find(t=> t.type === expr)
	return exprt? astify(ctx, exprt): []
}
expr.astValueGet = (ctx, t)=> tokensGroupPrio(ctx, t, t.type.lexemsAstTypes)
expr.lexems[1].type.astValueGet = (ctx, t)=> astify(ctx, t.tokens.find(t=> t.type === expr.single))
expr.single.astValueGet = (ctx, t)=> astify(ctx, t.tokens[0])

sp.astValueGet = t=> null

id.astValueGet = (ctx, t)=> t.match[0]
id.special.astValueGet = id.astValueGet
id.strip.astValueGet = (ctx, t)=> t.tokens.filter(t=> t.type !== dot).map(t=> astify(ctx, t))
id.striprest.astValueGet = (ctx, t)=> astify(ctx, t.tokens[1].tokens[0])

num.astValueGet = (ctx, t)=> Number(t.match[0])

text.raw.astValueGet = (ctx, t)=> t.match[0]
text.expr.astValueGet = (ctx, t)=> astify(ctx, t.tokens[1])
text.astValueGet = (ctx, t)=> t.tokens
	.filter(t=> t.type === text.inner)
	.map(t=> (astify(ctx, t.tokens[0]), t.tokens[0]))


// lexemsAstTypes definition

const {prefix, infix} = astidFlags

export const astids = {
	comma: {is: ({type: t, astValue: v})=> t===id.special && v===',', infix},
	other: {is: ()=> true, prefix},
}; astidsExpand(astids)

root.expr.lexemsAstTypes = [
	astids.comma,
	astids.other,
]; lexemsAstTypesExpand(root.expr.lexemsAstTypes)
