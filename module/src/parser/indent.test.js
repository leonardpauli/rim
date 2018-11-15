// parser/indent.test.js
// LeonardPauli/rim
//
// Created by Leonard Pauli, 10 nov 2018
// Copyright © Leonard Pauli 2018

import * as R from 'ramda'
import sfo, {log} from 'string-from-object'
import {
	stupidIterativeObjectDependencyResolve as declarative, P,
	deepAssign,
} from '@leonardpauli/utils/lib/object'
import {objectKeyPathFixedShallow} from '../utils/objectKeyPathFix'

import {expand} from './lexemUtils'
import {tokenizeNext, tokenizeCtxGet, matcher, config as tokenizerConfig} from './tokenizer'
import {evaluateStr} from './evaluate'
import {astify} from './aster'


// helpers
const keyfix = o=> objectKeyPathFixedShallow(o)

/*
// log(syntax)
// log(str)
// tokenizeNext(ctx, str)
// log(ctx.lexem.tokens[0])
// const astVal = astify(ctx, ctx.lexem)
// log(astVal)
 */


const testOne = ({
	syntax, ctx = {}, str, expected,
	checker = ({ctx, expected})=> expect(ctx.value).toBe(expected),
})=> {
	deepAssign(ctx, tokenizeCtxGet({lexem: syntax}))
	const v = evaluateStr(ctx, str)
	v.errors.map(e=> log(e))
	checker({ctx: v, expected})
}



describe('matcher', ()=> {

	it('custom (using matcherMatch)', ()=> {
		const syntax = declarative(({main})=> keyfix({
			'main.matcher': input=> {
				const substr = input.substr()
				const d = substr.match(/^\d/)
				const match = d? substr.match(new RegExp(`^(${d})(.{${parseInt(d, 10)}})`)): null
				return matcher.match(match)(input)
			},
			lexems: [main],
		}))
		expand(syntax)
		
		syntax.astValueGet = (ctx, t)=> astify(ctx, t.tokens[0])
		syntax.main.astValueGet = (ctx, t)=> t.match[0]
		syntax.evaluate = (ctx, t)=> t.astValue

		testOne({syntax, str: '2abcd', expected: '2ab'})
		testOne({syntax, str: '3abcd', expected: '3abc'})
	})

	it('custom (using matcherTokenize)', ()=> {
		const syntax = declarative(({main, a, b})=> keyfix({
			'a.regex': /^a/,
			'b.regex': /^b/,
			'a.container.lexems': [a],
			'b.container.lexems': [b],
			'initial.lexems{usingOr}': [a, b],
			'main.matcher': input=> {
				const res0 = matcher.tokenize({lexem: syntax.initial})(input)
				if (!res0.matched) return matcher.none()(input)

				const next = res0.tokens[0].tokens[0].type == syntax.a? syntax.b.container: syntax.a.container

				const res1 = matcher.tokenize({lexem: next})({...input, location: {s: res0.location.e}})
				if (!res1.matched) return matcher.none()(input)

				return matcher.tokens([...res0.tokens, ...res1.tokens])(input)
			},
			lexems: [main],
		}))
		expand(syntax)
		
		syntax.main.astValueGet = (ctx, t)=> t.tokens.map(t=> astify(ctx, t)).join(' ')

		testOne({syntax, str: 'ab', expected: 'a b'})
		testOne({syntax, str: 'ba', expected: 'b a'})
		testOne({syntax, str: 'aa', expected: void 0})
	})

	it('state simple', ()=> {
		const syntax = declarative(({main})=> keyfix({
			'main.matcher': matcher.regex.dynamic(({state})=> `^a{${state.count}}`),
			'main.state': ({ctx: {state}})=> ({count: 1, ...state}),
			lexems: [main],
		}))
		expand(syntax)
		syntax.main.astValueGet = astify.match

		// testOne({syntax, str: 'abbaaa', expected: 'abbaaabbbb'})
		testOne({syntax, str: 'aaaa', expected: 'a'})
		testOne({syntax, ctx: {state: {count: 2}}, str: 'aaaa', expected: 'aa'})
		testOne({syntax, ctx: {state: {count: 2}}, str: 'aaaa', expected: 'aa'})
	})

	it('state', ()=> {
		const syntax = declarative(({main})=> keyfix({
			'main.matcher': input=> {
				const count = (input.ctx.state.count || 0) + 1
				const res = matcher.regex.str(`^(a{${count}}|b{${count}})`)(input)
				res.type = {astValueGet: astify.match}
				if (!res.matched) return res

				const ressub = matcher.tokenize({
					state: {count},
					lexem: syntax.main.container,
				})({...input, location: {s: res.location.e}})

				return matcher.tokens([res, ...!ressub.matched?[]:ressub.tokens])(input)
			},
			'main.container.lexems': [main],
			lexems: [main],
		}))
		expand(syntax)
		
		const unwrap = a=> a[1] && Array.isArray(a[1])
			? [a[0], ...a[1].length > 1?unwrap(a[1]):a[1]]
			: a
		syntax.main.astValueGet = (ctx, t)=> unwrap(astify.tokens(ctx, t)).join(' ')

		// testOne({syntax, str: 'abbaaa', expected: 'abbaaabbbb'})
		testOne({syntax, str: 'abbaaabbbbbb', expected: 'a bb aaa bbbb'})
		testOne({syntax, str: 'baabbbaaaab', expected: 'b aa bbb aaaa'})
	})
})


describe('indent', ()=> {
	it('basic', ()=> {

		const syntax = declarative(({block, line})=> keyfix({
			'line.matcher': null,
			'line.empty.inner{regexAllowMatchingEmpty}.regex': /^([ \t]*(?=\n)|[ \t]+(?=$))/,
			'line.empty.lexems': [line.empty.inner, line.end],
			'line.end{regexAllowMatchingEmpty}.regex': /^(\n|$)/,
			block: keyfix({
				// TODO: resolve {type: {type: lexem...}}, eg. so `optional: true` can be moved to line.lexems
				'line.block': {type: block, state: ({state})=> ({depth: state.depth + 1}), optional: true},
				'line.lexems': [block.head, block.line.block],

				'indentation.matcher': matcher.regex.dynamic(({state})=> `^(\t|  ){${state.depth}}`),
				'indentation.faulty.regex': /^(\t|  )+/,

				'head.word.regex': /^\w+/,
				'head.lexems': [block.indentation, {type: block.indentation.faulty, optional: true}, block.head.word, line.end],

				'content.lexems{usingOr}': [line.empty, block.line],
				lexems: [{type: block.content, repeat: true}],
				state: ()=> ({depth: 0}),
			}),
			lexems: [{type: block, state: ()=> ({depth: 0})}],
		}))
		expand(syntax)

		const named = (name, v)=> { v.name = name; return v }

		syntax.line.end.astValueGet = ()=> ({name: 'line.end'})
		syntax.line.empty.astValueGet = ()=> ({name: 'line.empty'})
		syntax.block.astValueGet = (ctx, t)=> named('block', astify.tokens(ctx, t))

		syntax.block.content.astValueGet = (ctx, t)=> astify.tokens.first(ctx, t)
		syntax.block.indentation.astValueGet = (c, t)=> t.match[0].replace(/(\t|  )/g, '>').length
		syntax.block.indentation.faulty.astValueGet = syntax.block.indentation.astValueGet
		syntax.block.head.astValueGet = (ctx, t)=> ({
			indent: astify(ctx, t.tokens[0]),
			indentfaulty: t.tokens.length>3?astify(ctx, t.tokens[1]):0,
			content: astify(ctx, t.tokens[t.tokens.length-2]),
		})
		syntax.block.line.astValueGet = (ctx, t)=> named('line', {
			head: astify(ctx, t.tokens[0]),
			block: t.tokens.length>1? astify(ctx, t.tokens[1]): null,
		})

		syntax.astValueGet = (ctx, t)=> astify.tokens.first(ctx, t)
		syntax.evaluate = (ctx, t)=> t.astValue

		// tokenizerConfig.debug = true

		const simplifyBlock = b=> b.name == 'line.empty'
			? null
			: [b.head? (b.head.indentfaulty? b.head.indentfaulty: '')+b.head.content: null, ...b.block? simplify(b.block):[]]
		const simplify = t=> Array.isArray(t)? t.map(b=> simplifyBlock(b)): t
		const checker = ({ctx, expected})=> expect(simplify(ctx.value)).toMatchObject(expected)

		expect(simplify([{
			head: {indent: 0, content: 'r'},
			block: [{
				head: {indent: 1, content: 'k'},
				block: [{name: 'line.empty'}],
			}, {
				head: {indent: 1, content: 'l'},
			}],
		}, {
			head: {indent: 0, content: 'a'},
		}])).toMatchObject([['r', ['k', null], ['l']], ['a']])


		testOne({checker, syntax, str:
`r
	k

	l
a
`, expected: [['r', ['k', null], ['l']], ['a']]})


		testOne({checker, syntax, str:
`a
	aa
		aaa
		aab
	ab
b
c
		k
	ca
`, expected: [
			['a',
				['aa', ['aaa'], ['aab']],
				['ab']],
			['b'],
			['c',
				['1k'],
				['ca']]],
		})

	})
})
