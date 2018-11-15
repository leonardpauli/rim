// expression/stage-0-lexems.prepare.test.js
// LeonardPauli/rim
//
// Created by Leonard Pauli, 8 aug 2018
// Copyright © Leonard Pauli 2018

import * as R from 'ramda'
import sfo, {log} from 'string-from-object'
import {
	stupidIterativeObjectDependencyResolve as declarative, P,
} from '@leonardpauli/utils/lib/object'
import {objectKeyPathFixedShallow} from '../utils/objectKeyPathFix'

// import {testTokenizeStr, testManyGet} from '../parser/testUtils'
import {expand} from '../parser/lexemUtils'
import {tokenizeNext} from '../parser/tokenizer'
import {evaluateStr} from '../parser/evaluate'
import {astify} from '../parser/aster'

// import {evaluateStr, exprCtxDefaultGet} from '.'
import root from './stage-0-lexems'


// helpers
const keyfix = o=> objectKeyPathFixedShallow(o)


describe('prepare', ()=> {
	it('minimal syntax/tokenize/astify test', ()=> {
		const syntax = declarative(({space, word, part})=> ({
			space: {regex: /^ +/},
			word: {regex: /^[^ ]+/},
			part: {lexems: [space, word], usingOr: true},
			lexems: [{type: part, repeat: true}],
		}))
		expand(syntax)

		syntax.astValueGet = (ctx, t)=> t.tokens.map(t=> astify(ctx, t)).filter(Boolean)
		syntax.part.astValueGet = (ctx, t)=> astify(ctx, t.tokens[0])
		syntax.word.astValueGet = (ctx, t)=> t.match[0]
		syntax.space.astValueGet = (ctx, t)=> null

		const ctx = {lexem: syntax, errors: []}
		const str = 'hello there'
		tokenizeNext(ctx, str)
		expect(ctx.lexem.tokens).toHaveLength(3)
		const astVal = astify(ctx, ctx.lexem)
		expect(astVal).toMatchObject(['hello', 'there'])
		// const res = evaluateStr(ctx, str)
	})

	it('minimal syntax/tokenize/astify test using keyfix', ()=> {
		const syntax = declarative(({space, word, part})=> keyfix({
			'space.regex': /^ +/,
			'word.regex': /^[^ ]+/,
			'part{usingOr}.lexems': [space, word],
			lexems: [{type: part, repeat: true}],
		}))
		expand(syntax)

		syntax.astValueGet = (ctx, t)=> t.tokens.map(t=> astify(ctx, t)).filter(Boolean)
		syntax.part.astValueGet = (ctx, t)=> astify(ctx, t.tokens[0])
		syntax.word.astValueGet = (ctx, t)=> t.match[0]
		syntax.space.astValueGet = (ctx, t)=> null

		syntax.evaluate = (ctx, t)=> t.astValue

		const ctx = {lexem: syntax, errors: []}
		const str = 'hello there'
		evaluateStr(ctx, str)
		expect(ctx.value).toMatchObject(['hello', 'there'])
	})

	it('minimal syntax/tokenize/astify test using keyfix, usingOr on lexem', ()=> {
		const syntax = declarative(({space, word, part})=> keyfix({
			'space.regex': /^ +/,
			'word.regex': /^[^ ]+/,
			'part.lexems{usingOr}': [space, word],
			lexems: [{type: part, repeat: true}],
		}))
		expand(syntax)
		// log(syntax)

		syntax.astValueGet = (ctx, t)=> t.tokens.map(t=> astify(ctx, t)).filter(Boolean)
		syntax.part.astValueGet = (ctx, t)=> astify(ctx, t.tokens[0])
		syntax.word.astValueGet = (ctx, t)=> t.match[0]
		syntax.space.astValueGet = (ctx, t)=> null

		syntax.evaluate = (ctx, t)=> t.astValue

		const ctx = {lexem: syntax, errors: []}
		const str = 'hello there'
		tokenizeNext(ctx, str)
		expect(ctx.lexem.tokens).toHaveLength(3)
		evaluateStr(ctx, str)
		expect(ctx.value).toMatchObject(['hello', 'there'])
	})
})
