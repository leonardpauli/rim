// filterExpression/lexemUtils.js
// LayerRenamer
//
// created by Leonard Pauli, jun 2018
// copyright © Leonard Pauli 2018
//
// based on rim / towards rim

import sfo, {log} from 'string-from-object'
import {objectMapRecursive} from '@leonardpauli/utils/lib/object'
const concat = xxs=> xxs.reduce((a, xs)=> (a.push(...xs), a), [])

import {astify} from './aster'
import {matcher} from './tokenizer'


// Philosofy:
// 	- expressions should always parse, syntax errors reported back + skipped gracefully, warnings auto fixed (+ reported back)
// 	- parsed code should always be evaluatable


// lexems flags

export const flags = {
	// autoInsertIfNeeded: true, // if no other paths are valid, insert token even if it didn't exist, useful for eg. autoclose
	optional: true,
	repeat: true, // is one or more (+) by default, combine repeat + optional to get 0 or more (*)
	usingOr: true,
}
export const astidFlags = {
	prefix: true,
	suffix: true,
	infix: true,
}

// TODO: separate type and instance

// lexems example
const keysMeta = 'name,description,type'.split(',') // on .type
const keysMatch = 'matcher,regex,regexAllowMatchingEmpty,retain,lexems,usingOr,state'.split(',') // on .type
const keysTokenizerReserved = 'matched,match,location,tokens,lexems'.split(',')
const keysAst = 'astValueGet,lexemsAstTypes,astValue,astTokens,astId,astTokenWrapperIs,astTokenNot'.split(',')
export const keysReserved = concat([keysMeta, keysMatch, keysTokenizerReserved, keysAst, Object.keys(flags)])

/*
// (could probably use prototype/classes instead but nah, want to optimise for easy move to rim)
const lexem = {}
const lexemMatch = {
	regex: /^((g1)|(g2))/,
	regexAllowMatchingEmpty: false,
	retain: true, // true (all), n (retain n chars), -n (retain match.length-n chars), false | 0 (retain no chars)
} || {
	...{usingOr: true}||{lexemsModeAnd: false}, // match one of them || match all of them after each other (default)
	lexems: [lexem, lexem, ...lexem],
}
const lexemBase = {
	name: '...', // autogenerated from lexems tree structure, eg. text.expr.open
	description: 'what this lexem is...',
	someSubLexem: lexem,
}
const lexemExample = { ...lexemBase, ...lexemMatch, ...flags }
*/

export const lexemIs = v=> !!(v && v.type) // TODO: use symbol instead? (add in validate, export + check existance here)

export const lexemExtendCopyClean1Level = l=> ({
	...l.type===l? {type: l}: {...l},
	matched: void 0, match: void 0, // state: void 0,
	location: {s: void 0, e: void 0}, // s=start, e=end
	tokens: void 0, lexems: void 0,
	astTokens: void 0, astValue: void 0,
})


// process lexems
const lexemTypeValidateFix = (lt, opt)=> { // lexem type
	if (!lt.name) throw new Error(
		`lexem(${sfo(lt, 2)}).name not set`)

	if (lt.regex) {
		if (!(lt.regex instanceof RegExp)) throw new Error(
			`lexem(${lt.name}).regex (should be) instanceof RegExp (was ${lt.regex})`)
		if (''.match(lt.regex) && !lt.regexAllowMatchingEmpty) throw new Error(
			`lexem(${lt.name}).regex(${lt.regex}) matches zero length, please fix (or set lexem.regexAllowMatchingEmpty (tmp), or mod tokenizer, see TODO in tests)`)
		lt.retain = lt.retain === void 0? true: lt.retain===false? 0: lt.retain

		lt.matcher = lt.regex
		lt.regex = void 0
	}
	
	if (lt.matcher instanceof RegExp) {
		const regex = lt.matcher
		lt.matcher = matcher.regex(regex)
	}

	if (lt.matcher) {
		// TODO: if matcher is regex or array, use regex/lexems matcher util
		if (typeof lt.matcher != 'function') throw new Error(
			`lexem(${lt.name}).matcher is defined but not a function`)

		/* TODO: validate matcher result?
		const matcherResultKeysRequired = 'matched,match,location,tokens'.split(',')
		const res = lt.matcher({})
		const keys = Object.keys(res)
		const missed = matcherResultKeysRequired.filter(k=> !keys.includes(k))
		if (missed.length > 0) throw new Error(
			`lexem(${lt.name}).matcher result misses some keys (${missed})`)
		*/
			
	} else if (lt.lexems) {
		if (!Array.isArray(lt.lexems)) throw new Error(
			`lexem(${lt.name}).lexems has to be array`)
		lt.usingOr = lt.usingOr || lt.lexems.usingOr || false
		if (lt.usingOr && lt.lexems.some(l=> l.optional)) throw new Error(
			`lexem(${lt.name}).lexems has one optional, not allowed + ambiguos/doesn't make sense when usingOr`)
	} else if (lt.matcher!==null) throw new Error(
		// TODO: only require matcher if used as lexem (eg. in other lexem or is syntax root)
		`lexem(${lt.name}) has to have a matcher (.matcher/.lexems) (or set .matcher to null to dismiss)`)

	if (opt.autofixAstify) lexemTypeFieldAstifyAutoFix(lt)
}

const lexemTypeFieldAstifyAutoFix = lt=> {
	if (lt.astValueGet) return
	if (lt.matcher && lt.matcher.regex) return (lt.astValueGet = astify.match)
	if (lt.lexems) return (lt.lexems.length==1 || lt.lexems.usingOr) && !lt.lexems.some(l=> l.repeat)
		? (lt.astValueGet = astify.tokens.first)
		: (lt.astValueGet = astify.tokens)
}

export const _lexemProcessedSymbol = Symbol('lexem.processed')
const _process = (lexem, k, parent=null, state={named: new Set(), noname: new Set()}, opt)=> {
	if (!lexem) throw new Error(`${sfo({name: 'lexem is empty', lexem, k, parent}, 2)}`)
	if (lexem[_lexemProcessedSymbol]) return lexem
	lexem[_lexemProcessedSymbol] = true

	lexem.type = lexem.type || lexem
	const {type} = lexem

	// process meta
	type.name = type.name || (parent && parent.name+'.' || '')+k
	state.named.add(type)

	// validate matcher + set defaults
	lexemTypeValidateFix(type, opt)
	if (type.lexems) type.lexems.forEach((l, k)=>
		!l.name && state.noname.add([l, k, type]))

	// process children
	const keysChildren = Object.keys(type).filter(k=> !keysReserved.includes(k))
	keysChildren.forEach(k=> _process(type[k], k, type, state, opt))

	return lexem
}

const recursivelyFixNestedLexems = ([lexem, k, parent], opt)=> {
	lexem.type = lexem.type || lexem
	const {type} = lexem

	if (!type.name) {
		type.name = (parent && parent.name+'.' || '')+k
		type.lexems && type.lexems.forEach((l, k)=> type.lexems[k] = recursivelyFixNestedLexems([l, k, type], opt))
	}
	lexemTypeValidateFix(type, opt)
	return lexem
}

export const expand = (root, {autofixAstify = true, autofixEvaluate = true} = {})=> {
	if (Array.isArray(root)) throw new Error(
		`expand got array lexem, expected object, please wrap like {lexems: [<array-lexem>]}`)
	const state = {named: new Set(), noname: new Set()}
	_process(root, root.name || '@', null, state, {autofixAstify})
	state.noname.forEach(([lexem, k, parent])=> parent.lexems[k] =
		recursivelyFixNestedLexems([lexem, k, parent], {autofixAstify}))
	// intermediate lexems = named through recursivelyAddNameToLexems
	// all lexems = state.named + intermediate lexems

	if (autofixEvaluate) root.evaluate = (ctx, t)=> t.astValue
}


// TODO: do in lexems ast pre-processor?
export const astidsExpand = astids=>
	Object.keys(astids).map(k=> astids[k].name = astids[k].name || k)
export const lexemsAstTypesExpand = types=> types.forEach((p, i)=> p.prio = i)


export const lexemSimplifyForView = o=> objectMapRecursive(o, (v, k, {recurse})=>
		v && v.type && v.type === v? `${v.type.name}`
	: v && typeof v==='object' && !(v.constructor===Object || Array.isArray(v))? v
	: recurse? recurse()
	: v)

export const lexemAstValueToPlain = v=> objectMapRecursive(v, (v, k, {recurse})=>
	recurse? recurse(): v, {
	beforeMap: obj=> obj.type && obj.type===obj.type.type
		?	{type: obj.type.name, astValue: obj.astValue}
		: obj,
})
