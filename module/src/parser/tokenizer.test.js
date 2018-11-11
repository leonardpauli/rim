// filterExpression/tokenizer.test.js
// LayerRenamer
//
// created by Leonard Pauli, mid jun 2018
// copyright © Leonard Pauli 2018

import {log} from 'string-from-object'
import {stupidIterativeObjectDependencyResolve as objr} from '@leonardpauli/utils/lib/object'
import {tokenizeNext, tokenizeCtxGet} from './tokenizer'
import {flags, expand, lexemExtendCopyClean1Level} from './lexemUtils'

const {autoInsertIfNeeded, optional, repeat, usingOr} = flags

// TODO: make custom matcher
const _testTokens = (tokens_, targets)=> {
	const tokens = tokens_.filter(t=> t.match)
	expect(tokens).toHaveLength(targets.length)
	tokens.some((to, i)=> {
		const [match0, name, location] = targets[i]
		expect(to.match[0]).toBe(match0)
		name && expect(to.type.name).toBe(name)
		location && expect(to.location).toEqual(location)
		expect(to.matched).toBe(true)
		return false
	})
}
const testTokens = (tokens, targets, extra = {})=> {
	try {
		_testTokens(tokens, targets)
	} catch (err) { log({tokens, targets, ...extra}); throw err }
}
const testTokensL = (lexem, str, targets, {matched = !!targets.length} = {})=> {
	const ctx = tokenizeCtxGet({lexem})
	testTokens(tokenizeNext(ctx, str), targets, {str, ctx})
	expect(ctx.lexem.matched).toBe(matched)
}
const gs = s=> s.split('').map(s=> [s])
const testTokensS = (root, s)=> testTokensL(root, s, gs(s))


describe('simple', ()=> {
	it('a', ()=> {
		const root = objr(({a})=> ({
			a: {regex: /^a/},
			lexems: [a],
		})); expand(root)
		
		testTokensL(root, 'b', [])
		testTokensL(root, 'a', [['a', '@.a', {s: 0, e: 1}]])
	})

	it('a & b', ()=> {
		const root = objr(({a, b})=> ({
			a: {regex: /^a/},
			b: {regex: /^b/},
			lexems: [a, b],
		})); expand(root)
		
		testTokensL(root, 'a', [])
		testTokensL(root, 'b', [])
		testTokensL(root, 'ab', [['a', '@.a', {s: 0, e: 1}], ['b', '@.b', {s: 1, e: 2}]])
	})
	it('a | b', ()=> {
		const root = objr(({a, b})=> ({
			a: {regex: /^a/},
			b: {regex: /^b/},
			lexems: [a, b], usingOr,
		})); expand(root)
		
		testTokensL(root, 'a', [['a', '@.a', {s: 0, e: 1}]])
		testTokensL(root, 'b', [['b', '@.b', {s: 0, e: 1}]])
		testTokensL(root, 'ab', [['a', '@.a', {s: 0, e: 1}]])
	})
})

describe('optional', ()=> {
	it('a?', ()=> {
		const root = objr(({a})=> ({
			a: {regex: /^a/},
			lexems: [{type: a, optional}],
		})); expand(root)
		
		testTokensL(root, 'b', [], {matched: false})
		testTokensL(root, 'a', [['a', '@.a', {s: 0, e: 1}]])
	})

	it('a? & b', ()=> {
		const root = objr(({a, b})=> ({
			a: {regex: /^a/},
			b: {regex: /^b/},
			lexems: [{type: a, optional}, b],
		})); expand(root)
		
		testTokensL(root, 'a', [])
		testTokensS(root, 'b')
		testTokensS(root, 'ab')
	})
	it('a? | b', ()=> {
		const root = objr(({a, b})=> ({
			a: {regex: /^a/},
			b: {regex: /^b/},
			lexems: [{type: a, optional}, b], usingOr,
		}))
		expect(()=> expand(root)).toThrow(/ambiguos.* when usingOr/)
	})
})

describe('repeat', ()=> {
	it('a+', ()=> {
		const root = objr(({a})=> ({
			a: {regex: /^a/},
			lexems: [{type: a, repeat}],
		})); expand(root)
		
		testTokensL(root, 'b', [])
		testTokensL(root, 'ab', [['a']])
		testTokensS(root, 'aa')
		testTokensS(root, 'aaa')
	})

	it('a+ & b', ()=> {
		const root = objr(({a, b})=> ({
			a: {regex: /^a/},
			b: {regex: /^b/},
			lexems: [{type: a, repeat}, b],
		})); expand(root)
		
		testTokensL(root, 'b', [])
		testTokensL(root, 'a', [])
		testTokensL(root, 'ba', [])
		testTokensL(root, 'aa', [])
		testTokensS(root, 'ab')
		testTokensS(root, 'aab')
	})
	it('a+ | b', ()=> {
		const root = objr(({a, b})=> ({
			a: {regex: /^a/},
			b: {regex: /^b/},
			lexems: [{type: a, repeat}, b], usingOr,
		})); expand(root)

		testTokensL(root, 'b', [['b']])
		testTokensL(root, 'ba', [['b']])
		testTokensS(root, 'a')
		testTokensS(root, 'aa')
		testTokensL(root, 'ab', [['a', '@.a', {s: 0, e: 1}]])
		testTokensL(root, 'aab', [['a', '@.a', {s: 0, e: 1}], ['a', '@.a', {s: 1, e: 2}]])
	})

	it('a & b+', ()=> {
		const root = objr(({a, b})=> ({
			a: {regex: /^a/},
			b: {regex: /^b/},
			lexems: [a, {type: b, repeat}],
		})); expand(root)
		
		testTokensL(root, 'b', [])
		testTokensL(root, 'a', [])
		testTokensL(root, 'ba', [])
		testTokensL(root, 'aa', [])
		testTokensS(root, 'ab')
		testTokensL(root, 'aab', [])
		testTokensS(root, 'abb')
	})
	it('a | b+', ()=> {
		const root = objr(({a, b})=> ({
			a: {regex: /^a/},
			b: {regex: /^b/},
			lexems: [a, {type: b, repeat}], usingOr,
		})); expand(root)

		testTokensL(root, 'b', [['b']])
		testTokensL(root, 'bb', [['b'], ['b']])
		testTokensL(root, 'bba', [['b'], ['b']])
		testTokensL(root, 'ba', [['b']])
		testTokensL(root, 'a', [['a']])
		testTokensL(root, 'aa', [['a']])
		testTokensL(root, 'ab', [['a']])
		testTokensL(root, 'aab', [['a']])
		testTokensL(root, 'abb', [['a']])
	})
})

describe('repeat optional', ()=> {
	it('a*', ()=> {
		const root = objr(({a})=> ({
			a: {regex: /^a/},
			lexems: [{type: a, repeat, optional}],
		})); expand(root)
		
		testTokensL(root, 'b', [], {matched: false})
		testTokensL(root, 'a', [['a', '@.a', {s: 0, e: 1}]])
		testTokensL(root, 'aa', [['a', '@.a', {s: 0, e: 1}], ['a', '@.a', {s: 1, e: 2}]])
	})
	it('a* & b', ()=> {
		const root = objr(({a, b})=> ({
			a: {regex: /^a/},
			b: {regex: /^b/},
			lexems: [{type: a, repeat, optional}, b],
		})); expand(root)
		
		testTokensL(root, 'b', [['b']])
		testTokensL(root, 'a', [])
		testTokensL(root, 'aa', [])
		testTokensL(root, 'ab', [['a'], ['b', '@.b', {s: 1, e: 2}]])
		testTokensL(root, 'aab', [['a'], ['a', '@.a', {s: 1, e: 2}], ['b']])
	})

	it('a & b*', ()=> {
		const root = objr(({a, b})=> ({
			a: {regex: /^a/},
			b: {regex: /^b/},
			lexems: [a, {type: b, repeat, optional}],
		})); expand(root)
		
		testTokensL(root, 'b', [])
		testTokensL(root, 'a', [['a']])
		testTokensL(root, 'aa', [['a']])
		testTokensL(root, 'ab', [['a'], ['b']])
		testTokensL(root, 'abb', [['a'], ['b'], ['b', '@.b', {s: 2, e: 3}]])
	})
})

describe('nested', ()=> {
	describe('simple', ()=> {
		it('(a)', ()=> {
			const root = objr(({a})=> ({
				a: {regex: /^a/},
				lexems: [{lexems: [a]}],
			})); expand(root)
			
			testTokensL(root, 'b', [])
			testTokensL(root, 'a', [['a', '@.a', {s: 0, e: 1}]])
		})
		it('((a))', ()=> {
			const root = objr(({a})=> ({
				a: {regex: /^a/},
				lexems: [{lexems: [{lexems: [a]}]}],
			})); expand(root)
			
			testTokensL(root, 'b', [])
			testTokensL(root, 'a', [['a', '@.a', {s: 0, e: 1}]])
		})
	})

	// it('((a | b)*, b)', ()=> {
	// 	const root = objr(({a, b, inner, outer})=> ({
	// 		a: {regex: /^a/},
	// 		b: {regex: /^b/},
	// 		inner: {lexems: [a, b], usingOr},
	// 		outer: {lexems: [{...inner, repeat, optional}, b]},
	// 		lexems: [outer],
	// 	})); expand(root)
	//
	// 	testTokensL(root, 'a', [])
	// 	// testTokensL(root, 'b', [['b', '@.b', {s: 0, e: 1}]]) // TODO: match non-greedy?
	// 	testTokensL(root, 'b', [])
	// 	testTokensL(root, 'baa', [['b', '@.b', {s: 0, e: 1}]])
	// 	// testTokensL(root, 'baab', [['b', '@.b', {s: 0, e: 1}], ['a', '@.a', {s: 1, e: 2}], ['a', '@.a', {s: 2, e: 3}], ['b', '@.b', {s: 3, e: 4}]])
	// 	// const tokens = tokenizeNext({lexem: root}, 'abbab')
	// 	// expect(tokens).toHaveLength(5)
	// })

	describe('repeat', ()=> {
		const root = objr(({a, b, inner})=> ({
			a: {regex: /^a/},
			b: {regex: /^b/},
			inner: {lexems: [a, b], usingOr},
			lexems: [{type: inner, repeat, optional}],
		})); expand(root)

		it('(a | b)* // first', ()=> {
			testTokensS(root, 'a')
			testTokensS(root, 'b')
		})
		it('(a | b)* // many', ()=> {
			testTokensS(root, 'ab')
			testTokensS(root, 'ababaabb')
		})
	})

	it('((a | b)*, c)', ()=> {
		const root = objr(({a, b, c, inner, outer})=> ({
			a: {regex: /^a/},
			b: {regex: /^b/},
			c: {regex: /^c/},
			inner: {lexems: [a, b], usingOr},
			outer: {lexems: [{type: inner, repeat, optional}, c]},
			lexems: [outer],
		})); expand(root)
		
		testTokensL(root, 'a', [])
		testTokensL(root, 'b', [])
		testTokensS(root, 'c')
		testTokensS(root, 'ac')
		testTokensS(root, 'bc')
		testTokensS(root, 'abc')
		testTokensS(root, 'baac')
		testTokensS(root, 'abbac')
	})
	
})

// TODO: add a!, (a, b!) // should insert if not match + note in token?
