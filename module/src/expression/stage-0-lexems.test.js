// expression/stage-0-lexems.test.js
// LeonardPauli/rim
//
// Created by Leonard Pauli, 8 aug 2018
// Copyright © Leonard Pauli 2018

import sfo, {log} from 'string-from-object'
import {
	stupidIterativeObjectDependencyResolve as declarative, P,
} from '@leonardpauli/utils/lib/object'
import {objectKeyPathFixedShallow} from '../utils/objectKeyPathFix'

// import {testTokenizeStr, testManyGet} from '../parser/testUtils'
import {expand} from '../parser/lexemUtils'

// import {evaluateStr, exprCtxDefaultGet} from '.'
import root from './stage-0-lexems'


// helpers
const keyfix = o=> objectKeyPathFixedShallow(o)


describe('prepare', ()=> {
	it('TODO', ()=> {
		const s = root.singleline
		expect(s.lexems[1]).toBe(s.content.wrap)
		expand(s) // log(s)
		log(s, 5)
	})
})

describe('tokenize', ()=> {
	// testTokenizeStr(exprCtxDefaultGet(), 'haa', [['haa', '@.id']])
})

// describe.skip('astify', ()=> {
// })
