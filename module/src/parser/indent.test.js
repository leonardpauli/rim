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


describe('indent', ()=> {
	it('does', ()=> {
		expect(1+1).toBe(2)
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
