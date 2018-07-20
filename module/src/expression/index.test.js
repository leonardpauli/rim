// expression/filterExpression.test.js
// LeonardPauli/rim
//
// Created by Leonard Pauli, mid jul 2018
// Copyright © Leonard Pauli 2018

import sfo, {log} from 'string-from-object'

import {testTokenizeStr, testManyGet} from '../parser/testUtils'
import {expand} from '../parser/lexemUtils'

import {evaluateStr, exprCtxDefaultGet} from '.'
import root from './lexems'


describe('tokenize', ()=> {
	describe('minor', ()=> {
		const {id, text} = root

		const l1 = {lexems: [id.strip]}; expand(l1)
		testTokenizeStr({lexem: l1}, 'haa', [['haa', '@.id']])
		testTokenizeStr(exprCtxDefaultGet(), 'haa', [['haa', '@.id']])
		const l2 = {lexems: [text.raw]}; expand(l2)
		testTokenizeStr({lexem: l2}, 'haa', [['haa', '@.text.raw']])
	})

	describe('more', ()=> {
		testTokenizeStr(exprCtxDefaultGet(), 'a.aa', [['a', '@.id'], ['.', '@.dot'], ['aa', '@.id']])
		testTokenizeStr(exprCtxDefaultGet(), '(a.aa + y)', [
			['(', '@.paren.open'], ...[
				['a'], ['.'], ['aa'], [' ', '@.sp'], ['+', '@.id.special'], [' ', '@.sp'], ['y', '@.id'],
			], [')', '@.paren.close'],
		])
		testTokenizeStr(exprCtxDefaultGet(), '"hello\\(d + "y") there"', [
			['"', '@.text.open'], ...[
				['hello', '@.text.raw'], ['\\(', '@.text.expr.open'], ['(', '@.paren.open'], ...[
					['d', '@.id'], [' '], ['+'], [' '],
					['"', '@.text.open'], ['y'], ['"', '@.text.close'],
				], [')', '@.paren.close'], [' there'],
			], ['"', '@.text.close'],
		])
		testTokenizeStr(exprCtxDefaultGet(), 'a+', [['a', '@.id'], ['+', '@.id.special']])
	})
})

describe('astify', ()=> {
	const testMany = testManyGet((s, _, opt)=> {
		const ctx = exprCtxDefaultGet()
		// ctx.vars.name = 'Leo'
		// ctx.vars.a = {b: {c: 'itsa c'}}
		return evaluateStr(s, ctx, opt)
	}, {testAst: true})

	const {echar} = root

	describe('simple', ()=> testMany({
		
		'1': {
			type: root,
			astValue: void 0,
		},
		
		'/1/': {
			type: root,
			astValue: {
				step: { type: echar, astValue: '1'.charCodeAt(0) },
			},
		},

	}))

})
