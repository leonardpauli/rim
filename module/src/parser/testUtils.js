// utils/parser/testUtils.js
// LayerRenamer
//
// created by Leonard Pauli, jun 2018
// copyright © Leonard Pauli 2018

/* global expect it */

import sfo, {log, custom} from 'string-from-object'

import {objectMapRecursive} from '@leonardpauli/utils/lib/object'
import {expectDeepSubsetMatch} from '@leonardpauli/utils/lib/testUtils'

import {lexemSimplifyForView, lexemAstValueToPlain} from './lexemUtils'
import {tokenizeNext, tokenizeCtxGet} from './tokenizer'
import {evaluateStr} from './evaluate'


export const testTokenizeStr = (ctx, str, tasexp)=> it(str, ()=> {
	const tokens = tokenizeNext(ctx, str)
	const tas = tokens.filter(t=> t.match).map(t=> [t.match[0], t.type.name])
	try {
		expect(tas).toHaveLength(tasexp.length)
		tas.some((t, i)=> {
			const [s, name] = tasexp[i]
			s && expect(t[0]).toBe(s)
			name && expect(t[1]).toBe(name)
			return false
		})
	} catch (err) { log(tas); throw err }
})


/* usage:
	const testMany = testManyGet(lexem, {testAst: true})
	testMany({
		'a+b': {astValue: ['a', '+', 'b'], restStr: ''},
		'x': void 0,
	})
*/
export const testManyGet = (evaluateStrOrLexem, {testAst = false} = {})=> tests=> Object.keys(tests).forEach(k=> it(k, ()=> {
	const _evaluateStr = typeof evaluateStrOrLexem === 'function'? evaluateStrOrLexem: (str, _, opt)=> {
		const ctx = tokenizeCtxGet({lexem: evaluateStrOrLexem})
		evaluateStr(ctx, str, opt)
		return ctx
	}
	const ctx = _evaluateStr(k, void 0, {stopAfterAstify: testAst})
	
	if (tests[k] && tests[k].toerror) {
		const {toerror} = tests[k]
		expect(ctx.errors).toHaveLength(1)
		expect(ctx.errors[0].message).toMatch(toerror)
		return
	}

	if (testAst) {
		if (tests[k] === void 0)
			return expect(ctx.lexem.astValue).toBe(void 0)
		try {
			expectDeepSubsetMatch(
				lexemSimplifyForView(ctx.lexem),
				lexemSimplifyForView(tests[k]))
		} catch (err) {
			if (tests[k].astValue) {
				log(lexemAstValueToPlain(tests[k]), 10)
				log(lexemAstValueToPlain(ctx.lexem), 10)
			}
			throw err
		}
		return
	}

	if (!Array.isArray(tests[k])) throw new Error(`Expected tests[k] to be array, got ${tests[k]}`)
	const {value, restStr} = ctx
	const [valuet, restStrt] = tests[k]
	if (ctx.errors.length) {
		log(ctx.errors, 5)
		log(lexemAstValueToPlain(ctx.lexem), 8)
		expect(ctx.errors.length*1).toBe(0)
	}
	try {
		expect(value).toEqual(valuet)
		restStrt !== void 0 && expect(restStr).toBe(restStrt)
	} catch (err) {
		// log({k, ctx}, 3)
		throw err
	}
}))
