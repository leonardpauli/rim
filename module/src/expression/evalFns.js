// expression/evalFns.js
// LeonardPauli/rim
//
// Created by Leonard Pauli, mid jul 2018
// Copyright © Leonard Pauli 2018
//
// rim lang core creates declarative mappings / graph structure
// actual processing functions has to be added
// 	(this file is a startingpoint for that)


const {infix, commutative, associative} = {
	// for ast parsing
	infix: true, // a ~ b
	// TODO: right vs left associativity? https://en.wikipedia.org/wiki/Operator_associativity
	// 	+ non-associativity, eg. a < b < c -> a < b and b < c (and not (a < b) < c)

	prefix: true, // ~a
	suffix: true, // a~
	// for ast optimisation
	commutative: true, // a ~ b = b ~ a
	associative: true, // (a ~ b) ~ c = a ~ (b ~ c)
	// https://unspecified.wordpress.com/2008/12/28/commutative-but-not-associative/3
	// https://math.stackexchange.com/a/327433/576109
	// 	"operation that takes two points on a plane and return their midpoint"
	// 	a ~ b = b ~ a; (a ~ b) ~ c ≠ a ~ (b ~ c)
}
const typeNumber = {in: {a: 'number', b: 'number'}, out: 'number'}
const typeArray = {in: {a: 'array', b: 'array'}, out: 'array'}
const typeString = {in: {a: 'string', b: 'string'}, out: 'string'}

const ids = [
	{identifier: 'plus', aliases: [{identifier: '+', infix, commutative, associative}], fns: [{
		type: typeNumber, fn: (a, b)=> a + b,
		type: typeString, fn: (a, b)=> a + b,
		type: typeArray, fn: (a, b)=> [...a, ...b],
	}]},
	{identifier: 'minus', aliases: [{identifier: '-', infix, associative}], fns: [{
		type: typeNumber, fn: (a, b)=> a - b,
	}]},
	{identifier: 'mul', aliases: [{identifier: '*', infix, commutative, associative}], fns: [{
		type: typeNumber, fn: (a, b)=> a * b,
	}]},
	{identifier: 'div', aliases: [{identifier: '/', infix, associative}], fns: [{
		type: typeNumber, fn: (a, b)=> a / b,
	}]},
]

ids.map(v=> v.aliases[0]).map((v, i)=> v.priority = i)

export default ids

// astId.evaluate
// basic comparison is built into the language?
// at least the "is" operator, though a fn might have to be provided for some types (isable??,
// 	first compare type, then isvalue, which is a function
// 	that returns a number based on input list/binary data)
// eq.evaluate = (ctx, t, args)=> args[0] === args[1]


/* expr.astValueGet = (ctx, t)=> tokensGroupPrio(ctx, t, t.type.lexemsAstTypes)
const {prefix, infix} = astidFlags
export const astids = {
	comma: {is: ({type: t, astValue: v})=> t===id.special && v===',', infix},
	eq: {is: ({type: t, astValue: v})=> t===id.special && v==='=', infix},

	plus: {is: ({type: t, astValue: v})=> t===id.special && v==='+', infix},
	minus: {is: ({type: t, astValue: v})=> t===id.special && v==='-', infix},
	mul: {is: ({type: t, astValue: v})=> t===id.special && v==='*', infix},
	div: {is: ({type: t, astValue: v})=> t===id.special && v==='/', infix},

	other: {is: ()=> true, prefix},
}; astidsExpand(astids)

root.expr.lexemsAstTypes = [
	astids.comma,
	astids.eq,

	astids.plus,
	astids.minus,
	astids.mul,
	astids.div,
	
	astids.other,
]; lexemsAstTypesExpand(root.expr.lexemsAstTypes)
*/
