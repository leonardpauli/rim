// Sudoku view
// Created by Leonard Pauli, 20 may 2018
// Copyright © Leonard Pauli, 2018
// exploration of view / data separation using rim -> js with moduler

const range = (s, e, st=1*(s>e?-1:1))=> {const a = []; for (let i=s; i<=e; i+=st) a[a.length] = i; return a}
const sort = xs=> xs.sort()
const groupby = keyExtractor=> xs=> xs.reduce((c, v)=> ((k=> (c[k] = c[k] || []).push(v))(keyExtractor(v)), c), {})
const mod = (a, b)=> a % b
const div = (a, b)=> Math.floor(a / b)
const eq = (a, b)=> deepEqual(a, b) // used in filter Model(prop=value)
const is = (a, b)=> eq(a, b) // could be different..., check subset?
const isIn = (x, xs)=> xs.includes(x)
const overlay = (target, ...sources)=> Object.assign(target, ...sources) // TODO: But deep, ie. overlay({a: {b: 7}}, {a: {c: 5}}) -> {a: {b: 7, c: 5}}
const intersection = (...xss)=> xss[0] // TODO: get intersection, etc, probably use lodash or similar...
const init = Self=> val=> {
	const argSignatureGet = val=> Object.keys(val).sort()
	const argSignature = argSignatureGet(val)
	const argSignatureMatch = s=> argSignature.length === s.length && !argSignature.some((v, i)=> v!=s[i])
	// TODO: add optional type info to argSignature / arg
	const match = Self.inits.find(o=> argSignatureMatch(argSignatureGet(o.arg)))
	if (!match) throw `non-matching signature {${argSignature.join(', ')}} for ${Self.__name}, `+
		`available: ${Self.inits.map(argSignatureGet).map(v=> `\n\t- {${v.join(', ')}}`)}`

	return match(Self)(val)
}
const clone = val=> ({...val}) // TODO: should be deep?, used like Thing{more: "data"} -> overlay(clone(Thing), {more: "data"})


const Sudoku = model({
	__name: 'Sudoku',
	'inner.side': 3,
	'outer.side': 3,
	'total.side': ({me})=> me.inner.side * me.outer.side,
	maxNr: ({me})=> me.total.side,
	
	'values.raw': [null, 7, null, 2, 5, null, 4, null, null, 8, null, null, null, null, null, 9, null, 3, null, null, null, null, null, 3, null, 7, null, 7, null, null, null, null, 4, null, 2, null, 1, null, null, null, null, null, null, null, 7, null, 4, null, 5, null, null, null, null, 8, null, 9, null, 6, null, null, null, null, null, 4, null, 1, null, null, null, null, null, 5, null, null, 7, null, 8, 2, null, 3, null],
	leftFilter: {
		value: null, // is Number{range: 1..maxNr} or null
		'options.available.max': null, // is Number{range: 0..maxNr} or null
	},

	availableValues: ({me})=> it=> range(1, me.maxNr).filter(v=> !isIn(v, it)),
	Box: model({
		__name: 'Sudoku.Box',
		__inits: [{
			arg: {index: null, value: null},
			handler: Self=> ({index, value})=> overlay(clone(Self), {index, value})
		}],
		
		index: 0, // is Number.Int // TODO: shouldn't have default + throw if init'ed without value
		value: null, // is Number{range: 1..maxNr} or null

		total: {
			x: ({me, setupParents: [Sudoku]})=> mod(me.index, Sudoku.total.side),
			y: ({me, setupParents: [Sudoku]})=> div(me.index, Sudoku.total.side),
		},
		
		outer: {
			x: ({me, setupParents: [Sudoku]})=> div(me.index, me.x, Sudoku.outer.side),
			y: ({me, setupParents: [Sudoku]})=> div(me.index, me.y, Sudoku.outer.side),
		},
		// outer: Object.assign({}, ...['x', 'y'].map(a=> ({[a]: ({me, setupParents: [Sudoku]})=> div(me.index, me[a], Sudoku.outer.side)}))),
		inner

	}),
})

	
	['x', 'y'].map(it=> r.outer = {}; r.outer[it] = div(Sudoku.outer[it], outer.side); return r}))
	['x', 'y'].map(it=> r.inner = {}; r.inner[it] = mod(Sudoku.inner[it], inner.side); return r}))

	overlay(Box, {outer: {}}); overlay(Box, ...['x', 'y'].map(it=> {const r = {}; r.outer = {}; r.outer[it] = div(Sudoku.outer[it], outer.side); return r}))
	overlay(Box, {inner: {}}); overlay(Box, ...['x', 'y'].map(it=> {const r = {}; r.inner = {}; r.inner[it] = mod(Sudoku.inner[it], inner.side); return r}))

	Box.all = [] // is many Box
	overlay(Box, {inner: {}}); Box.inner.family = Box.all.filter(it=> eq({x: it.outer.x, y: it.outer.y}, {x: Box.outer.x, y: Box.outer.y}))

	overlay(Box, {inner: {}}); overlay(Box, ...['x', 'y'].map(it=> {const r = {}; const a = it; r.inner = {}; r.inner[it] = {}; r.inner[it].family = Box.inner.family.filter(it=> eq(it.total[a], Box.total[a])); return r}))
	overlay(Box, {total: {}}); overlay(Box, ...['x', 'y'].map(it=> {const r = {}; const a = it; r.total = {}; r.total[it] = {}; r.total[it].family = Box.all.filter(it=> eq(it.total[a], Box.total[a])); return r}))

	const self = Box // this??
	overlay(Box, {inner: {}}); Box.inner.availableValues = Sudoku.availableValues(Box.inner.family.filter(it=> !is(it, self)).map(it=> it.value))
	overlay(Box, {total: {}}); overlay(Box, ...['x', 'y'].map(it=> {const r = {}; const a = it; r.total = {}; r.total[it] = {}; r.total[it].availableValues = Sudoku.availableValues(Box.total[it].filter(it=> !is(it, self)).map(it=> it.value)); return r}))

	Box.available = intersection(
		Box.inner.availableValues,
		...['x', 'y'].map(it=> Box.total[it].availableValues))
	
	Box.options = range(1, Sudoku.maxNr).map(it=> {const index = it; const r = init((()=> {
		const Option = {}
		Option.__name = 'Option'

		// // TODO: make use of inner.side more generic like maxNr, also see grid is View...options...size
		Option.pos = {}
		Option.pos.x = mod(Option.index, Sudoku.inner.side)
		Option.pos.y = div(Option.index, Sudoku.inner.side)

		Option.available = isIn(Option.value, Box.available)
		Option.sameInInner = Box.inner.family.filter(it=> is(it.value, null)).map(it=> overlay(clone(it), {optionsFiltered: it.options.filter(it=> eq(it.value, Option.value))}).filter(it=> !is(it.optionsFiltered, null)))

		// TODO: pipe groupby through Object.values()
		Option.lineInBox = (it=> {const r = is(it[0], 1); return r})(sort( ['x', 'y'].map(it=> {const a = it; const r = groupby(it=> it.inner[a])(Option.sameInInner); return r} ).map(it=> it.length) ))

		return Option
	})(), {index, value: index}); return r})

	Box.wrong = !is(Box.value, null) && !isIn(Box.value, Box.available)

	return Box
})()



/*
Sudoku.view: View
	border: 1, .red
	- title: Text{is h1} "This is an about page"

	- bar: View
		- Text "leftFilter:"
		- Text{editable}: leftFilter.value
		- Text{editable}: leftFilter.options.available.max

	- grid: View
		box.size: 50
		size: box.size * totalBoxSide
		border: 2, black

		- ...: boxes: values.raw |> BoxView{key: .index} {index: .index, value: it}

	BoxView is View
		position: box.size |> total.(.key) * it
		size: box.size

		border 1, .black{alpha: 0.1}
			offset: .inside
			(left.color.alpha: 0.6) if .outer.x > 0 and .inner.x is 0
			(top.color.alpha: 0.6) if .outer.y > 0 and .inner.y is 0
		(background: .red) if .wrong

		- Text{editable; align: center; size: .fill}: .valueRaw to String
			(background: .black{alpha: 0.01}) if is focused

		- if .value is null: options is View{size: fill; not interactive}
			- ...: .options |> it{is Text (it.value to String)}
				size: .parent.size / inner.side
				position: size * pos

				font.size: 8
				opacity: match:
					- .same: 0.2
					- .available: 0.5
					- else: 0
				background:
					r: 0
					g: (.sameInInner.count is 0) to Int
					b: 1
					a: 0.9 / (pow{2} (.sameInInner.count + 1))
				(border.radius: 10) if .lineInBox

				- Text{font.size: 6} .sameInInner.count
*/
