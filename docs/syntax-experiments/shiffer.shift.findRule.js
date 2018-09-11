// shiffer.shift.findRule.js
// created by Leonard Pauli, 15 aug 2018

const range = m=> Array(m).fill().map((_, i)=> i)
const alts, findMatch, getParams, list, testMatch, altChoices

list = range(26).map(i=> String.fromCharCode(i+65))
list.push(...list, ...list, ...list)

altChoices = range(3).map(a1=> range(3).map(a2=> range(3).map(a0=> [a0, a1, a2]))
	).reduce((p, a)=> p.concat(a)
	).reduce((p, a)=> p.concat(a))

getParams = (a, b, A = a.toUpperCase(), B = b.toUpperCase())=>
	[].map.call(A, (c, i)=> ({
		a: c,
		b: B[i],
		i,
		ai: list.indexOf(c),
		bi: list.indexOf(B[i]),
	})).map(a=> ({...a,
		abid: a.ai-a.bi,
	})).filter(v=> v.ai>=0)

alts = [0, 1, -1]
testMatch = ({ai, bi, i, abid}, [o1, o2, o3])=> alts[o1]*bi + alts[o2]*i + alts[o3]*abid == ai
printMatch = ({ai, bi, i, abid}, [o1, o2, o3])=>
	`${alts[o1]}*bi(${bi}) + ${alts[o2]}*i(${i}) + ${alts[o3]}*abid(${abid}) == ai(${ai})`

findMatch = c=> altChoices.find(a=> testMatch(c, a))

fixCase = c=> {
	m = findMatch(c)
	console.log(printMatch(c, m))
	return m
}

fix = (a, b)=> {
	a = getParams(a, b).map(c=> {
		m = findMatch(c)
		console.log(printMatch(c, m))
		return m
	})
	return a
}

fix(
"it's not a bug, it's a feature",
"jw'y xdo c lnj, wt'f b zkxictb"
)
