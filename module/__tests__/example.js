import lib from 'js-module-base/src' // see note in /Users/leonardpauli/projects/own/docs/app/node/testing

describe('simple', ()=> {
	it('adds', ()=> {
		expect(1+1).toBe(2)
	})
	it('lib', ()=> {
		lib('Jajajaja')
	})
})
