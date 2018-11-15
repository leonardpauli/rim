// expression/stage-0-lexems.singleline.test.js
// LeonardPauli/rim
//
// Created by Leonard Pauli, 8 aug 2018
// Copyright © Leonard Pauli 2018

import * as R from 'ramda'
import sfo, {log} from 'string-from-object'
import {
	stupidIterativeObjectDependencyResolve as declarative, P, deepAssign,
} from '@leonardpauli/utils/lib/object'
import {objectKeyPathFixedShallow} from '../utils/objectKeyPathFix'

import {testTokenizeStr, testManyGet} from '../parser/testUtils'
import {expand, lexemSimplifyForView, lexemAstValueToPlain} from '../parser/lexemUtils'
import {config, tokenizeNext, tokenizeCtxGet} from '../parser/tokenizer'
import {evaluateStr} from '../parser/evaluate'
import {astify} from '../parser/aster'

// import {evaluateStr, exprCtxDefaultGet} from '.'
import root, {singleLineGet, stringGet, identifierGet} from './stage-0-lexems'


// helpers
const keyfix = o=> objectKeyPathFixedShallow(o)


const testOne = ({syntax, ctx = {}, str, expected})=> {
	deepAssign(ctx, tokenizeCtxGet({lexem: syntax}))
	const ts = tokenizeNext(ctx, str)
	expect(ts).toMatchObject(expected)
	// const v = evaluateStr(ctx, str)
	// v.errors.map(e=> log(e))
	// expect(ctx.value).toBe(expected)
}


describe('singleline', ()=> {
	describe('string', ()=> {
		const syntax = stringGet()
		expand(syntax)

		const testMany = testManyGet(syntax, {testAst: true})
		testMany({
			'"a"': {astValue: ['"', 'a', '"']},
			'"a+b': {astValue: ['"', 'a+b', null]},
			'"a\\tb"': {astValue: ['"', 'a', ['\\', 't'], 'b', '"']},
		})
	})

	describe('identifier', ()=> {
		const syntax = identifierGet()
		expand(syntax)

		// const ctx = tokenizeCtxGet({lexem: syntax})
		// config.debug = true
		// tokenizeNext(ctx, 'ab98')
		// config.debug = false
		// log(ctx)

		const testMany = testManyGet(syntax, {testAst: true})
		testMany({
			a: {astValue: ['a']},
			'a.b': {astValue: ['a']},
			aa98h: {astValue: ['aa', ['98h']]},
			'9a': void 0,
			'a-b': {astValue: ['a', ['-b']]},
			'-a': void 0,
			'.': void 0,
			// '.': {astValue: ['.']},
			// '...': {astValue: ['...']},
			// '|>': {astValue: ['|>']},
			// '|flip>': {astValue: ['|flip>']},
		})
	})

	// it.skip('TODO - multiline', ()=> {
	// 	expand(root)
	// 	log(root, 5)
	// })
})

describe('tokenize', ()=> {
	// testTokenizeStr(exprCtxDefaultGet(), 'haa', [['haa', '@.id']])
})

// describe.skip('astify', ()=> {
// })
