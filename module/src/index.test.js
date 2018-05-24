import src from '../src' // see note in $lpdocs/app/node/testing

describe('simple', ()=> {
	it('adds', ()=> {
		expect(1+1).toBe(2)
		const f = []
		expect(f).toHaveLength(0)
	})
})
