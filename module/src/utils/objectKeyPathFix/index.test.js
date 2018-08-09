// objectKeyPathFix.test.js
// rim
//
// created by Leonard Pauli, aug 2018
// copyright © Leonard Pauli 2018

/* eslint quote-props:0 */

import sfo, {log} from 'string-from-object'
import {testTokenizeStr, testManyGet} from '../../parser/testUtils'
import {expand} from '../../parser/lexemUtils'

import {
	evaluateStr, exprCtxDefaultGet,
	patchesGet, objectKeyPathFixedShallow,
} from '.'


describe('tokenize', ()=> {
	testTokenizeStr(exprCtxDefaultGet(), 'a.aa', [['a', 'keyPathFix.id'], ['.', 'keyPathFix.dot'], ['aa', 'keyPathFix.id']])
	testTokenizeStr(exprCtxDefaultGet(), 'a{c}.b{f}.r', [
		['a', 'keyPathFix.id'],
		['{', 'keyPathFix.block.start'],
		['c', 'keyPathFix.id'],
		['}', 'keyPathFix.block.close'],
		['.', 'keyPathFix.dot'],
		['b', 'keyPathFix.id'],
		['{', 'keyPathFix.block.start'],
		['f', 'keyPathFix.id'],
		['}', 'keyPathFix.block.close'],
		['.', 'keyPathFix.dot'],
		['r', 'keyPathFix.id'],
	])
})


describe('evaluate / patchesGet', ()=> {
	const k = {org: 'here'}
	const v = {v: 'value'}
	const testMany = testManyGet(s=> {
		const ctx = exprCtxDefaultGet({vars: {}})
		return evaluateStr(s, ctx)
	})

	const patchesPath = 'a{c}.b{f, g}.r'
	const patchesRes = [
		{path: ['a', 'c'], value: true},
		{path: ['a', 'b', 'f'], value: true},
		{path: ['a', 'b', 'g'], value: true},
		{path: ['a', 'b', 'r'], valuePlaceholder: true},
	]
	describe('patchesGet - evaluate', ()=> testMany({
		[patchesPath]: [patchesRes],
	}))
	it('patchesGet - fn', ()=>
		expect(patchesGet(patchesPath)).toEqual(patchesRes))

	
	describe('objectKeyPathFixedShallow', ()=> {

		const fixed = objectKeyPathFixedShallow({
			'space{optional}.lexems{usingOr}': [' '],
			'space.tab': '\t',
			b: 'b',
			'cool{custom}.x': 'there',
			'coola{custom}': {y: 'there'},
		}, {vars: {custom: 'hello'}})
		const target = {
			space: {
				optional: true,
				lexems: (o=> (o.usingOr = true, o))([' ']),
				tab: '\t',
			},
			b: 'b',
			cool: {
				custom: 'hello',
				x: 'there',
			},
			coola: {
				custom: 'hello',
				y: 'there',
			},
		}
		// log({fixed, target})
		expect(fixed).toEqual(target)

		const testManyM = o=> Object.keys(o).map(k=> it(k, ()=> expect(
			objectKeyPathFixedShallow({[k]: v})
		).toEqual(o[k])))
		
		describe('some', ()=> testManyM({
			'a': {a: v},
			'b.c': {b: {c: v}},
			'b.c.d': {b: {c: {d: v}}},
			'a{b}': {a: {b: true, ...v}},
			'a{b}.c': {a: {b: true, c: v}},
			'a{c}.b{f}.r': {a: {c: true, b: {f: true, r: v}}},
		}))

		it('handles object non Object', ()=> expect(
			objectKeyPathFixedShallow({'a.regex': /^some/}).a
		).toEqual({regex: /^some/}))

	})

})
