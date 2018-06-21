// utils/object.test.js
// LayerRenamer
//
// created by Leonard Pauli, jun 2018
// copyright © Leonard Pauli 2018

import {log} from 'string-from-object'
import {stupidIterativeObjectDependencyResolve, deepAssign, P} from './object'


describe('P.unwrap', ()=> {
	it('some', ()=> {
		const o = {a: 1}
		const p = P(o)
		expect(p.b.c).toEqual({})
		expect(o.b.c).toEqual({})
		p.b.d = 7
		expect(p.b.d).toEqual(7)
		expect(o.b.d).toEqual(7)
		expect(p).not.toBe(o)
		// expect(P.unwrap(p)).toBe(P.unwrap(p))
		// expect(P.unwrap(o)).toBe(P.unwrap(o))
		expect(P.unwrap(p)).toBe(o)
		// log(p, {nameExtractor: ()=> void 0})
	})
	it('recursive manual detatched add', ()=> {
		const o = {a: 1}
		const o2 = {b: 1}
		const p = P(o)
		const p2 = P(o2)
		p.o2 = p2
		p.o2.x = 5

		expect(p.o2).not.toBe(o2)
		expect(P.unwrap(p).o2).not.toBe(o2)
		expect(P.unwrapRecursive(p).o2).toBe(o2)
		// log(p, {nameExtractor: ()=> void 0})
	})
	it('recursive', ()=> {
		const o2 = {b: 1}
		const o = {a: 1, o2}
		const p = P(o)
		p.o2.x = 5

		expect(p.o2).not.toBe(o2)
		expect(P.unwrapRecursive(p).o2).toBe(o2)
		// log(p, {nameExtractor: ()=> void 0})
	})
	it('multiple same', ()=> {
		const fn = (s, {expr} = s)=> ({
			expr: {description: 'expression'},
			lexems: [expr],
			paren: {expr},
			paren2: {expr},
			lexems2: [expr],
			paren3: {expr},
			paren4: {expr},
		})
		const r = stupidIterativeObjectDependencyResolve(fn, {n: 1})
		// log(r)
		expect(r.expr).toBe(r.paren.expr)
		expect(r.expr).toBe(r.lexems[0])
	})
})

describe('deepAssign', ()=> {
	// it('assigns', ()=> {
	// })
	// it('keeps ref', ()=> {
	// })
	it('keeps ref - circular', ()=> {
		const ra = {b: 1}
		const r = {a: ra}
		const o = {a: {b: 2}}; o.a.c = o.a
		deepAssign(r, o)
		// log(r)
		expect(r.a.b).toBe(2)
		expect(r.a).toBe(ra)
	})
})

describe('stupidIterativeObjectDependencyResolve', ()=> {
	it('resolves', ()=> {
		const r = stupidIterativeObjectDependencyResolve(self=> ({
			a: 1,
			l1: {a: 2, b: 3},
			c: {a: 2, b: 3, ssum: self.s.sum, gsum: self.c.ssum, rsum: self.c.gsum},
			s: {sum: self.c.a + self.c.b},
			circular: (Number(self.circular) || 0) + (Number(self.l1.a)||2)-1,
		}), {n: 4})
		// log(r)
		expect(r).toEqual({
			a: 1,
			l1: { a: 2, b: 3 },
			c: { a: 2, b: 3, ssum: 5, gsum: 5, rsum: 5 },
			s: { sum: 5 },
			circular: 6,
		})
	})
	it('keeps ref', ()=> {
		const fn = self=> ({
			a: {b: 1},
			c: self.a,
		})
		const r = stupidIterativeObjectDependencyResolve(fn, {n: 1})
		// log(r)
		expect(r).toEqual({
			a: {b: 1},
			c: {b: 1},
		})
		expect(r.a).toBe(r.c)
	})
	it('keeps ref - circular', ()=> {
		const r = stupidIterativeObjectDependencyResolve(self=> ({
			a: {b: 1, c: self.a},
		}), {n: 2})
		// log(r)
		expect(r.a.b).toBe(1)
		expect(r.a.c).toBe(r.a)
	})
})
