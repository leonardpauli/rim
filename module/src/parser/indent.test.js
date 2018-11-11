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

/*
// log(syntax)
// log(str)
// tokenizeNext(ctx, str)
// log(ctx.lexem.tokens[0])
// const astVal = astify(ctx, ctx.lexem)
// log(astVal)
 */


describe('matcher', ()=> {
	const testOne = ({syntax, str, expected})=> {
		const v = evaluateStr({lexem: {...syntax}, errors: []}, str)
		v.errors.map(e=> log(e))
		expect(v.value).toBe(expected)
	}


	it('custom (using matcherMatch)', ()=> {
		const syntax = declarative(({main})=> keyfix({
			'main.matcher': input=> {
				const {substr} = input
				const d = substr.match(/^\d/)
				const match = d? substr.match(new RegExp(`^(${d})(.{${parseInt(d, 10)}})`)): null
				return input.utils.matcherMatch({match, ...input})
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
				const res0 = input.utils.matcherTokenize({...input, lexem: syntax.initial})
				if (!res0.matched) return input.utils.matcherNone(input)

				const next = res0.tokens[0].tokens[0].type == syntax.a? syntax.b.container: syntax.a.container

				const res1 = input.utils.matcherTokenize({...input, lexem: next, location: {s: res0.location.e}})
				if (!res1.matched) return input.utils.matcherNone(input)

				return input.utils.matcherTokens({tokens: [...res0.tokens, ...res1.tokens]})
			},
			lexems: [main],
		}))
		expand(syntax)
		
		syntax.main.astValueGet = (ctx, t)=> t.tokens.map(t=> astify(ctx, t)).join(' ')

		testOne({syntax, str: 'ab', expected: 'a b'})
		testOne({syntax, str: 'ba', expected: 'b a'})
		testOne({syntax, str: 'aa', expected: void 0})
	})

	it.skip('state', ()=> {
		const syntax = declarative(({main})=> keyfix({
			'main.matcher': input=> {
				const {substr} = input
				const d = substr.match(/^\d/)
				const match = d? substr.match(new RegExp(`^(${d})(.{${parseInt(d, 10)}})`)): null
				return input.utils.matcherMatch({match, ...input})
			},
			'main.state': ()=> ({count: 1}),
			lexems: [main],
		}))
		expand(syntax)
		
		syntax.astValueGet = (ctx, t)=> astify(ctx, t.tokens[0])
		syntax.main.astValueGet = (ctx, t)=> t.match[0]
		syntax.evaluate = (ctx, t)=> t.astValue

		testOne({syntax, str: 'abbaaabbbbbbbbbbbbb', expect: 'abbaaabbbb'})
		testOne({syntax, str: 'bbbaaaab', expect: 'bbbaaaa'})
	})

	it.skip('custom', ()=> {
		const syntax = declarative(({main})=> keyfix({
			'main.matcher': input=> {
				const {substr} = input
				const d = substr.match(/^\d/)
				const match = d? substr.match(new RegExp(`^(${d})(.{${parseInt(d, 10)}})`)): null
				return input.utils.matcherMatch({match, ...input})
			},
			lexems: [main],
		}))
		expand(syntax)
		// log(syntax)

		syntax.astValueGet = (ctx, t)=> astify(ctx, t.tokens[0])
		syntax.main.astValueGet = (ctx, t)=> t.match[0]
		syntax.evaluate = (ctx, t)=> t.astValue
		// log(str)
		// tokenizeNext(ctx, str)
		// log(ctx.lexem.tokens[0])
		// const astVal = astify(ctx, ctx.lexem)
		// log(astVal)
		expect(evaluateStr({lexem: {...syntax}, errors: []}, '2abcd')).toMatchObject({value: '2ab', errors: []})
		expect(evaluateStr({lexem: {...syntax}, errors: []}, '3abcd').value).toBe('3abc')
	})

	it.skip('matcher as', ()=> {
		const syntax = declarative(({theOther})=> keyfix({
			theOther: {
				state: ()=> ({
					last: 'b',
					get toMatch () { return this.last=='a'? 'b': 'a' },
				}),
				matcher: ({state, str, utils: {returnMatch}})=>
					returnMatch(str.match(new RegExp(`^${state.toMatch}`))),
			},
			lexems: [{type: theOther, repeat: true}],
		}))
		expand(syntax)
		log(syntax)

		syntax.astValueGet = (ctx, t)=> astify(ctx, t.tokens[0])
		syntax.theOther.astValueGet = (ctx, t)=> t.match[0]
		
		syntax.evaluate = (ctx, t)=> t.astValue

		const ctx = {lexem: syntax, errors: []}
		const str = 'abab'
		log(str)
		// tokenizeNext(ctx, str)
		// log(ctx.lexem.tokens[0])
		// const astVal = astify(ctx, ctx.lexem)
		// log(astVal)
		evaluateStr(ctx, str)
		log(ctx.value)
		// expect(ctx.value).toMatchObject(['{', 'hello', 'there', '}'])
	})
})


describe('indent', ()=> {
	it.skip('basic', ()=> {

		const syntax = declarative(({block, indent})=> keyfix({
			indent: keyfix({
				'lineEmpty.regex': /^N-A$/,
				'dentSame.regex': /^N-A$/,
				'dentIn.regex': /^N-A$/,
				'dentOut.regex': /^N-A$/,
				state: ()=> ({depth: 0}),
				matcher: ({state, str})=> {
					const match = str.match(/^(\t*)(\n|$)?/)
					const indents = match[1].length
					const eol = !!match[2]
					return eol ? indent.lineEmpty
						: indents == state.depth ? indent.dentSame
						: indents > state.depth ? indent.dentIn
						: indent.dentOut
				},
			}),
			block: {
				state: ()=> ({depth: 0}),
				matcher: ({state})=> {

				},
			},
			lexems: [{type: block, state: ()=> ({depth: 0})}],
		}))

		;`
		a
			aa
				aaa
				aab
			ab
		b
		c
			ca
		`


	})

})


/*
see expression/stage-0-lexems.test.js

it('using matcher', ()=> {

	// TODO: inefficient - better calculate indents count once then act, eg. using custom matcher?
	const syntax = declarative(({indent, expression, block, lineTerminator})=> keyfix({
		'indent.regex': /^(\t|  )/,
		'expression.regex': /^a/,
		'lineTerminator.regex': /^\n/,
		block: keyfix({
			indent: {
				matcher: ({str})=> {
					str.
				},
			}
			state: ()=> ({depth: 0}),
			'content.lexems': [expression, {type: lineTerminator, optional: {'keep-unmatched': true}}],
			ghost: indenterGet(keyfix({
				indent,
				'on0.regex': /^N-A break/,
				'on1.lexems{usingOr}': [block.content, block.ghost],
			})),
			lex: indenterGet(keyfix({
				indent,
				'on0.regex': /^N-A break/,
				'on1.lexems{usingOr}': [block.content, block.ghost],
			})),
			lexems: [block.lex],
		}),
		lexems: [{type: block, state: ()=> ({depth: 0})}],
	}))
	expand(syntax)
	log(syntax)

	syntax.astValueGet = (ctx, t)=> astify(ctx, t.tokens[0])
	syntax.indent.astValueGet = ()=> '⇥'
	syntax.expression.astValueGet = (ctx, t)=> t.match[0]
	syntax.lineTerminator.astValueGet = ()=> '\n'
	syntax.block.first.astValueGet = (ctx, t)=> astify(ctx, t.tokens[0])
	syntax.block.astValueGet = (ctx, t)=> astify(ctx, t.tokens[0])
	syntax.block.content.astValueGet = (ctx, t)=> t.tokens.map(t=> astify(ctx, t))
	
	const fixindenterastvg = l=> {
		l.astValueGet = (ctx, t)=> astify(ctx, t.tokens[0])
		l.lexems[0].astValueGet = (ctx, t)=> t.tokens.map(t=> astify(ctx, t))
		l.lexems[0].lexems[1].astValueGet = (ctx, t)=> astify(ctx, t.tokens[0])
	}
	fixindenterastvg(syntax.block.lex)
	fixindenterastvg(syntax.block.ghost)

	syntax.evaluate = (ctx, t)=> t.astValue

	const blockstr = ([s])=> s.replace(new RegExp(`\n\t{${s.match(/^\n+(\t*)/)[1].length}}`, 'g'), '\n').slice(1)
	const ctx = {lexem: syntax, errors: []}
	const str = blockstr`
	a
		b
	`
	log(str)
	// tokenizeNext(ctx, str)
	// log(ctx.lexem.tokens[0])
	// const astVal = astify(ctx, ctx.lexem)
	// log(astVal)
	evaluateStr(ctx, str)
	log(ctx.value)
	// expect(ctx.value).toMatchObject(['{', 'hello', 'there', '}'])
})



it('base case', ()=> {

	const indenterGet = ({indent, on0, on1})=> declarative(()=> keyfix({
		'lexems{usingOr}': [{lexems: [indent, on1]}, on0],
	}))

	// TODO: inefficient - better calculate indents count once then act, eg. using custom matcher?
	const syntax = declarative(({indent, expression, block, lineTerminator})=> keyfix({
		'indent.regex': /^(\t|  )/,
		'expression.regex': /^a/,
		'lineTerminator.regex': /^\n/,
		block: keyfix({
			'content.lexems': [expression, {type: lineTerminator, optional: {'keep-unmatched': true}}, ],
			ghost: indenterGet(keyfix({
				indent,
				'on0.regex': /^N-A break/,
				'on1.lexems{usingOr}': [block.content, block.ghost],
			})),
			lex: indenterGet(keyfix({
				indent,
				'on0.regex': /^N-A break/,
				'on1.lexems{usingOr}': [block.content, block.ghost],
			})),
			'first.lexems': [block.content],
			lexems: [block.lex],
		}),
		lexems: [block.first],
	}))
	expand(syntax)
	log(syntax)

	syntax.astValueGet = (ctx, t)=> astify(ctx, t.tokens[0])
	syntax.indent.astValueGet = ()=> '⇥'
	syntax.expression.astValueGet = (ctx, t)=> t.match[0]
	syntax.lineTerminator.astValueGet = ()=> '\n'
	syntax.block.first.astValueGet = (ctx, t)=> astify(ctx, t.tokens[0])
	syntax.block.astValueGet = (ctx, t)=> astify(ctx, t.tokens[0])
	syntax.block.content.astValueGet = (ctx, t)=> t.tokens.map(t=> astify(ctx, t))
	
	const fixindenterastvg = l=> {
		l.astValueGet = (ctx, t)=> astify(ctx, t.tokens[0])
		l.lexems[0].astValueGet = (ctx, t)=> t.tokens.map(t=> astify(ctx, t))
		l.lexems[0].lexems[1].astValueGet = (ctx, t)=> astify(ctx, t.tokens[0])
	}
	fixindenterastvg(syntax.block.lex)
	fixindenterastvg(syntax.block.ghost)

	syntax.evaluate = (ctx, t)=> t.astValue

	const blockstr = ([s])=> s.replace(new RegExp(`\n\t{${s.match(/^\n+(\t*)/)[1].length}}`, 'g'), '\n').slice(1)
	const ctx = {lexem: syntax, errors: []}
	const str = blockstr`
	a
		b
	`
	log(str)
	// tokenizeNext(ctx, str)
	// log(ctx.lexem.tokens[0])
	// const astVal = astify(ctx, ctx.lexem)
	// log(astVal)
	evaluateStr(ctx, str)
	log(ctx.value)
	// expect(ctx.value).toMatchObject(['{', 'hello', 'there', '}'])
})



	const syntax = declarative(({indent, expression, block})=> keyfix({
		'indent.regex': /^(\t|  )/,
		'expression.regex': /^a/,
		block: {
			state: ()=> ({depth: 0}),
			pre: ({state})=> ({lexems: R.range(0, state.depth).map(()=> indent)}),
			'content.lexems': [
				expression,
				{type: block, state: ({state})=> ({depth: state.depth+1}), optional: true},
			],
			lexems: [block.pre, block.content],
		},
	}))

it('base case', ()=> {
	const syntax = declarative(({indent, expression, block})=> keyfix({
		indent: {
			regex: /^(\t|  )/,
			inner: {

			},
			outer: {
				state: ()=> ({depth: 0}),
				// matcher: ({p, helpers: {lexemMatch, range}})=> s=> lexemMatch({lexems: range(p.state.depth).map(i=> indent)})(s),
				lexems: [p=> ({type: indent, repeat: p.state.depth})],
			},
		},
		'expression.regex': /^a/,
		block: keyfix({
			state: ()=> ({depth: 0}),
			prefix: {type: indent.outer, state: p=> ({depth: p.state.depth})},
			sub: {type: block, state: p=> ({depth: p.state.depth+1}), optional: true},
			'content.lexems': [expression, block.sub],
			'lexems{usingOr}': [block.prefix, indent.inner, block.content],
		}),
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
*/
