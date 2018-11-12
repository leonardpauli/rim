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
	if (!baseLexem.location) baseLexem.location = {}
	if (baseLexem.location.s===void 0) baseLexem.location.s = 0
	if (baseLexem.location.e===void 0) baseLexem.location.e = str.length
	const se = baseLexem.location.e

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
			b.location.s = bPrev? bPrev.location.e: baseLexem.location.s
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

		const matcherInput = {
			ctx,
			location: {
				s: b.location.e,
				e: se,
			},
			str,
			substr () { return this.str.substring(this.location.s, this.location.e) },
			matcher,
			keepUnmatched: lexemOptionalKeepUnmatchedGet(l),
			retain: l.type.retain,
			get state () { return l.state? l.state({ctx, type: l.type}): l.type.state ? l.type.state({ctx}): ctx.state },
		}

		const matchRes = l.type.matcher(matcherInput)
		Object.assign(l, matchRes)

 		handleMatch(bs, lis)
	}
}

export const tokenizeNext = (ctx, str)=> {
	const baseLexem = ctx.lexem // Beware! mutating // lexemExtendCopyClean1Level(ctx.lexem)
	tokenizeNextCore(ctx, str)
	// TODO: don't return anything to signal that baseLexem has been changed?
	return extractMatchTokens(baseLexem)
}

export const tokenizeCtxGet = ({lexem})=> ({
	lexem: lexemExtendCopyClean1Level(lexem),
	errors: [],
	state: {},
})


// helpers

const extractMatchTokens = l=> l.matched
	? [l, ...concat(l.tokens.map(t=> extractMatchTokens(t)))]
	: []

// const safeToYieldGet = bs=> !bs
// 	.filter((v, i)=> i <= bs.length-1)
// 	.some(b=> !b.type.usingOr) // TODO: should also be ok if rest lexems in an usingAnd is optional



// matcher

export const matcher = {}

matcher.none = ({matched = false} = {})=> ({
	location = {s: 0},
} = {})=> ({
	matched,
	match: null,
	location: {
		s: location.s,
		e: location.s + 0,
	},
	tokens: [],
})

matcher.tokens = tokens=> _input=> ({
	matched: true,
	match: null,
	location: {
		s: tokens[0].location.s,
		e: tokens[tokens.length-1].location.e,
	},
	tokens,
})

matcher.match = match=> ({location, keepUnmatched, retain})=> {
	const matched = !!(match || keepUnmatched)
	const retainLength = !matched? 0: retainLengthGet({
		str: match && match[0], keepUnmatched, retain })

	return {
		matched,
		match: matched? match: null,
		location: {
			s: location.s,
			e: location.s + retainLength,
		},
		tokens: [],
	}
}

matcher.regex = regex=> {
	const fn = input=> matcher.match(input.substr().match(regex))(input)
	fn.regex = regex
	return fn
}
matcher.regex.str = regexStr=> matcher.regex(new RegExp(regexStr))
matcher.regex.dynamic = regexStrGet=> input=> matcher.regex.str(regexStrGet(input))(input)

matcher.tokenize = ctx=> ({location, ctx: inputCtx, str})=> {
	ctx.lexem = Object.assign(lexemExtendCopyClean1Level(ctx.lexem), {
		location,
	}),
	Object.assign(ctx, Object.assign({}, inputCtx, ctx))

	tokenizeNextCore(ctx, str)
	return {
		matched: ctx.lexem.matched,
		match: ctx.lexem.match,
		location: ctx.lexem.location,
		tokens: [ctx.lexem],
	}
}



// getters

const lexemOptionalKeepUnmatchedGet = l=>
	l.optional && l.optional['keep-unmatched']

const retainLengthGet = ({retain = true, str, keepUnmatched = false})=>
		!str && keepUnmatched ? 0
	: retain===true ? str.length
	: retain>=0 ? retain
	: Math.max(0, str.length + retain) // negative regain, cut from end of matched



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
