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

	/*
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
	*/

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

				'head.word.regex': /^\w+/,
				'head.lexems': [block.indentation, block.head.word, line.end],

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
		syntax.block.head.astValueGet = (ctx, t)=> ({
			indent: astify(ctx, t.tokens[0]),
			content: astify(ctx, t.tokens[1]),
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
			: [(b.head || {}).content, ...b.block? simplify(b.block):[]]
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
		}])).toMatchObject([ [ "r", [ "k", null ], [ "l" ] ], [ "a" ] ])

		testOne({checker, syntax, str:
`r
	k

	l
a
`, expected: [ [ "r", [ "k", null ], [ "l" ] ], [ "a" ] ]})
		testOne({checker, syntax, str:
`a
	aa
		aaa
		aab
	ab
b
c
	ca
`, expected: [
			['a',
				['aa', ['aaa'], ['aab']],
				['ab']],
			['b'],
			['c',
				['ca']]],
		})

/*
		testOne({checker, syntax, str:

`r
	k
	l
a
`

||`a
	

	aa

	aa
b`

|| `a
	aa
		aaa
		aab
	ab
b
c
	ca`
		|| 'dagg\n\t\n\n\tbhhh\nc', expected: ' '
				|| 'block.content(.line(indent(0),agg,eol))'
			+ '\nblock.content(line.empty)'
			+ '\nblock.content(line.empty)'
			+ '\nblock.content(.nested(block.content(.line(indent(1),bhhh,eol))))'
			+ '\nblock.content(.line(indent(0),c,eol))',
		})
		// '\t' || '\ta' || 'a\n\tb\n'
		// tokenizerConfig.debug = false


		;`
		a
			aa
				aaa
				aab
			ab
		b
		c
			ca
		`*/


	})

})


/*
see expression/stage-0-lexems.test.js



'content.lexems': [block.content.inner, eol],
'content.container.lexems': [
	// {type: lineEmpty, repeat: true, optional: true},
	block.content,
	{type: lineEmpty, optional: true},
	{type: block, state: ({ctx})=> ({depth: ctx.state.depth}), optional: true}],
matcher: input=> {
	if (input.substr().length==0) return matcher.none()(input)

	const {depth} = input.state
	const depthIndent = R.range(0, depth).map(_=> '⇥').join('')
	if (depth>5) return matcher.none()(input)
	
	const lineEmpty = matcher.regex(/^[\t ]*(\n|$)/)(input)
	lineEmpty.astValueGet = ()=> depthIndent+'(empty line)'
	if (lineEmpty.matched) return lineEmpty

	const pre = matcher.regex.str(`^(\t|  ){${depth}}`)(input)
	if (!pre.matched) return matcher.none()(input)

	const indent = matcher.regex.str(`^(\t|  )`)({...input, location: {s: pre.location.e}})
	indent.astValueGet = ()=> depthIndent+'(extra indent)'
	if (indent.matched) return indent

	const content = matcher.tokenize({
		lexem: syntax.block.content.container,
		state: {depth: depth+1},
	})({...input, location: {s: pre.location.e}})
	content.astValueGet = astify.tokens
	
	return content
},



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
