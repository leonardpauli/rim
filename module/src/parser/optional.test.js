// parser/indent.test.js
// LeonardPauli/rim
//
// Created by Leonard Pauli, 10 nov 2018
// Copyright © Leonard Pauli 2018

import * as R from 'ramda'
import sfo, {log} from 'string-from-object'
import {
	stupidIterativeObjectDependencyResolve as declarative, P,
} from '@leonardpauli/utils/lib/object'
import {objectKeyPathFixedShallow} from '../utils/objectKeyPathFix'

import {expand} from './lexemUtils'
import {tokenizeNext} from './tokenizer'
import {evaluateStr} from './evaluate'
import {astify} from './aster'


// helpers
const keyfix = o=> objectKeyPathFixedShallow(o)


describe('optional.keep-unmatched', ()=> {
	it('base case', ()=> {
		const syntax = declarative(({space, word, part, words, paren})=> keyfix({
			'space.regex': /^ +/,
			'word.regex': /^[^ ()]+/,
			'part.lexems{usingOr}': [space, word],
			words: {type: part, repeat: true},
			paren: keyfix({
				'open.regex': /^\(/,
				'close.regex': /^\)/,
				lexems: [paren.open, words, {type: paren.close, optional: true}],
			}),
			lexems: [paren],
		}))
		expand(syntax)

		syntax.astValueGet = (ctx, t)=> astify(ctx, t.tokens[0])
		syntax.paren.astValueGet = (ctx, t)=> t.tokens.map(t=> astify(ctx, t)).filter(Boolean)
		syntax.paren.open.astValueGet = (ctx, t)=> '{'
		syntax.paren.close.astValueGet = (ctx, t)=> '}'
		syntax.part.astValueGet = (ctx, t)=> astify(ctx, t.tokens[0])
		syntax.word.astValueGet = (ctx, t)=> t.match[0]
		syntax.space.astValueGet = (ctx, t)=> null

		syntax.evaluate = (ctx, t)=> t.astValue

		const ctx = {lexem: syntax, errors: []}
		const str = '(hello there)'
		// tokenizeNext(ctx, str)
		// log(ctx.lexem.tokens[0])
		// const astVal = astify(ctx, ctx.lexem)
		// log(astVal)
		evaluateStr(ctx, str)
		expect(ctx.value).toMatchObject(['{', 'hello', 'there', '}'])
	})

	it('keyfix issue', ()=> {
		const b = {v: 'b'}
		expect(keyfix({a: b}).a).toBe(b)

		let i = 0
		const syntax = declarative(({a})=> ({
			a: {v: i++},
			b: keyfix({type: a}),
			c: {type: a},
		}), {n: 4})
		// log(syntax)
		expect(syntax.c.type).toBe(syntax.a)
		expect(syntax.b.type).toBe(syntax.a)
	})

	it('using it', ()=> {
		const syntax = declarative(({space, word, part, words, paren})=> keyfix({
			'space.regex': /^ +/,
			'word.regex': /^[^ ()]+/,
			'part.lexems{usingOr}': [space, word],
			words: {type: part, repeat: true},
			paren: keyfix({
				'open.regex': /^\(/,
				'close.regex': /^\)/,
				lexems: [paren.open, words, {type: paren.close, optional: {'keep-unmatched': true}}],
			}),
			lexems: [{type: paren, repeat: true}],
		}), {n: 8})
		expand(syntax)

		syntax.astValueGet = (ctx, t)=> R.concat([], t.tokens.map(t=> astify(ctx, t)))
		syntax.paren.astValueGet = (ctx, t)=> t.tokens.map(t=> astify(ctx, t)).filter(Boolean)
		syntax.paren.open.astValueGet = (ctx, t)=> '{'
		syntax.paren.close.astValueGet = (ctx, t)=> '}'
		syntax.part.astValueGet = (ctx, t)=> astify(ctx, t.tokens[0])
		syntax.word.astValueGet = (ctx, t)=> t.match[0]
		syntax.space.astValueGet = (ctx, t)=> null

		syntax.evaluate = (ctx, t)=> t.astValue

		const ctx = {lexem: syntax, errors: []}
		const str = '(hello there ohh (mee'
		// tokenizeNext(ctx, str)
		// log(ctx.lexem.tokens[0])
		// const astVal = astify(ctx, ctx.lexem)
		// log(astVal)
		evaluateStr(ctx, str)
		log(ctx.value)
		expect(ctx.value).toMatchObject([['{', 'hello', 'there', 'ohh', '}'], ['{', 'mee', '}']])
	})

})
