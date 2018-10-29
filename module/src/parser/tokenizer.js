// filterExpression/tokenizer.js
// LayerRenamer
//
// created by Leonard Pauli, mid jun 2018
// copyright © Leonard Pauli 2018

import {log} from 'string-from-object'
import {lexemExtendCopyClean1Level} from './lexemUtils'

const concat = xxs=> xxs.reduce((a, xs)=> (a.push(...xs), a), [])


// export const tokenizePart = (ctx, str)=> {
// 	const state = {}
// 	const path = [...tokenize(ctx, str, state)]; const {restStr} = state
// 	// if (restStr===str) throw new Error(`Path "${restStr}" isn't valid path`)
// 	return {path, restStr}
// }

// export const tokenize = function* tokenize (ctx, str, state = {}) {
// 	state.restStr = str; let item
// 	while (state.restStr && ({item, restStr: state.restStr} =
// 		tokenizeNext(ctx, state.restStr), item)) yield item
// 	return state.restStr
// }

export const config = {tokenizeNextMaxIterations: 100000}
// eslint-disable-next-line max-statements
export const tokenizeNextCore = (ctx, str)=> { // ctx = {lexem}
	// assumes ctx.lexem has gone through lexemUtils.expand for validation etc
	if (!ctx.lexem.type.lexems) throw new Error( // TODO: possibly just autowrap if necessary?
		`tokenizeNext: ctx.lexem(${ctx.lexem.type.name}) has to have .lexems; -> just wrap it {lexems: [<lexem>]}`)
	if (ctx.lexem.type.repeat) throw new Error( // TODO: possibly just autowrap if necessary?
		`tokenizeNext: ctx.lexem(${ctx.lexem.type.name}) can't have .repeat; -> just wrap it {lexems: [<lexem>]}`)

	// b = block, l = lexem, i = index
	// bs  = [b, b, ...]; b  = bs[bi];  b = [l, l, ...]
	// lis = [i, i, ...]; li = lis[bi]; l = b[li]
	// bi = bs.length-1
	//
	// b.usingAnd = b.lexems && !b.usingOr
	//
	// b.location.(s, e) // start, end; index in str

	const baseLexem = ctx.lexem
	baseLexem.location = {s: 0, e: 0}
	const se = str.length // string end, possibly take from baseLexem.location.e
	const bs = [baseLexem]
	const lis = []

	let cntr = 0
	while (bs.length > 0) {
		cntr++
		// TODO: remove, shouldn't happen wrongly (check all edge cases)
		// 	if a regex matches zero width, loc.s-loc.e = 0, -> infinite
		// 	TODO: add regex ''.match(regex) test in lexem validator
		if (cntr>=config.tokenizeNextMaxIterations) throw new Error(
			`tokenizeNext got cntr = ${cntr}, please increase config.tokenizeNextMaxIterations or check for issues`)

		// get block
		const bi = bs.length-1
		// if (bi >= bs.length || bi >= lis.length+1) throw new Error( // TODO: shouldn't happen, remove
		// 	`bi >= bs.length (${bi} >= ${bs.length}) || bi >= lis.length+1`)
		const b = bs[bi]

		// get lexem index + starting on new block
		if (bi == lis.length) {
			lis.push(0)
			
			const bPrev = bi>0? bs[bi-1]: null
			b.location.s = bPrev? bPrev.location.e: 0
			b.location.e = b.location.s

			b.tokens = []

			if (b.type.lexems) { // TODO: test code branch?
				b.lexems = b.type.lexems.map(lexemExtendCopyClean1Level)
				b.matched = !b.type.usingOr // set matched var default state
			}
		}
		const li = lis[bi]

		// get lexem
		const ls = b.lexems
		if (li == ls.length) { // done with block
			bNextDo(bs, lis)
			continue
		}
		// if (li > ls.length) throw new Error( // TODO: shouldn't happen, remove
		// 	`li > ls.length (${li} > ${ls.length})`)
		const l = ls[li]

		// TODO: yield tokens when as soon as decided
		// 	(eg. not inside usingAnd block, or rest is optional)
		// 	const safeToYield = safeToYieldGet(bs)

		if (l.type.lexems) { // add + goto new block
			bs.push(l)
			continue
		}

		l.location.s = b.location.e
		l.location.e = se

		// log({al: l})
		const keepUnmatched = l.optional && l.optional['keep-unmatched']
		const match = str.substring(l.location.s, l.location.e).match(l.type.regex)
		if (!match && !keepUnmatched) {
			l.location.e = l.location.s
			l.tokens = []
			l.matched = false; handleMatch(bs, lis); continue
		}

		const retainLength =
				!match && keepUnmatched ? 0
			: l.type.retain===true ? match[0].length
			: l.type.retain>=0 ? l.type.retain
			: Math.max(0, match[0].length + l.type.retain)
		// TODO: validate that expand has been run before loop instead?
		if (isNaN(retainLength)) throw new Error(
			`invalid lexem, forgot to run root through lexemUtils.expand?`)
		l.location.e = l.location.s + retainLength
		// log({lo:l.location.s, retainLength, match, r: l.retain})

		l.match = match
		l.tokens = []
		l.matched = true; handleMatch(bs, lis); continue
	}
}

export const tokenizeNext = (ctx, str)=> {
	const baseLexem = ctx.lexem // Beware! mutating // lexemExtendCopyClean1Level(ctx.lexem)
	tokenizeNextCore(ctx, str)
	// TODO: don't return anything to signal that baseLexem has been changed?
	return extractMatchTokens(baseLexem)
}


// helpers

const extractMatchTokens = l=> l.matched? [l, ...concat(
	l.tokens.map(t=> extractMatchTokens(t)))]: []

// const safeToYieldGet = bs=> !bs
// 	.filter((v, i)=> i <= bs.length-1)
// 	.some(b=> !b.type.usingOr) // TODO: should also be ok if rest lexems in an usingAnd is optional


// logic subs

const handleMatch = (bs, lis)=> {
	const bi = bs.length-1; const li = lis[bi]
	const b = bs[bi]
	const l = b.lexems[li]

	const {repeatShould, bNextDoShould} = fixOk(b, l)

	// if (repeatShould) log({repeatShould, b, l}, 2)
	
	if (repeatShould) lInsertForRepeatOptional(bs, lis, l)
	else if (bNextDoShould) { bNextDo(bs, lis); return }

	lNextDo(bs, lis)
}

const fixOk = (b, l)=> {
	const repeatShould = l.matched && l.repeat
	const repeatFirst = l.repeat && !l.optional // no optional non-repeat in or
	const matchedDefaultChanged = b.matched == b.type.usingOr
	const backFromFailingRepeat = l.repeat && matchedDefaultChanged
	const bNextDoShould =
				(b.type.usingOr && l.matched)
		|| (!b.type.usingOr && !l.matched && !l.optional)
		|| backFromFailingRepeat

	if (bNextDoShould && (repeatFirst || !l.repeat))
		b.matched = l.matched // or will turn on, and will turn off
	if (b.matched) b.location.e = l.location.e
	// log({l, repeatShould, repeatFirst, matchedDefaultChanged, backFromFailingRepeat, bNextDoShould, b}, 3)

	return {repeatShould, bNextDoShould}
}

const bNextDo = (bs, lis)=> {
	const bi = bs.length-1; const li = lis[bi]
	const b = bs[bi]
	// const l = b[li]

	// b.matched // keep it as is, either the default or changed in handleMatch

	b.tokens = b.matched? b.lexems.slice(0, li+1).filter(l=> l.matched): []
	b.matched = b.matched && !!b.tokens.length
	bs.pop(); lis.pop() // remove current/last b
	
	const {repeatShould, bNextDoShould} = bi>0? fixOk(bs[bi-1], b): {}
	
	// if (repeatShould) log({repeatShould, b})
	if (repeatShould) lInsertForRepeatOptional(bs, lis, b)
	else if (bNextDoShould) { bNextDo(bs, lis); return }
	// log({b}, 3)

	lNextDo(bs, lis)
}

const lInsertForRepeatOptional = (bs, lis, l)=> {
	const bi = bs.length-1; const li = lis[bi]
	const b = bs[bi]
	// const l = b[li]

	b.lexems.splice(li+1, 0, {...lexemExtendCopyClean1Level(l), optional: true})
}

const lNextDo = (bs, lis)=> {
	const bi = bs.length-1
	lis[bi]++ // do next step on b
	// log({a: true, bs, lis, bi, lexems: bs[bi] && bs[bi].lexems})
}
