// objectKeyPathFix/syntax.js
// rim
//
// created by Leonard Pauli, aug 2018
// copyright © Leonard Pauli 2018

import {log} from 'string-from-object'
import {stupidIterativeObjectDependencyResolve} from '@leonardpauli/utils/lib/object'
import {relativePathTokenRegex} from '@leonardpauli/utils/lib/nodesAtRelativePath'
import {root as filterExpression} from '../filterExpression'
import {root as regexp} from '../regularExpression'

import {astidsExpand, flags, expand, lexemAstValueToPlain} from '../../parser/lexemUtils'
import {evaluate} from '../../parser/evaluate'
import {astify} from '../../parser/aster'


// --- TOKENIZE ----

const {optional, repeat, usingOr} = flags

// lexems definition

const root = stupidIterativeObjectDependencyResolve(({
	id, dot, comma, space, path, block,
})=> ({
	name: 'keyPathFix',
	lexems: [path],

	path: {
		lexems: [id, {type: path.continuation, repeat, optional}],
		continuation: {usingOr, lexems: [path.component, block]},
		component: {lexems: [dot, id]},
	},

	dot: {regex: /^\./},
	comma: {regex: /^,/},
	space: {regex: /^ /},

	id: {regex: /^[^ .,{}][^.,{}]*/},
	block: {
		start: {regex: /^\{/},
		close: {regex: /^\}/},
		lexems: [block.start, block.list, block.close],

		list: {lexems: [path, {type: block.continuation, repeat, optional}]},
		continuation: {lexems: [comma, {type: space, repeat, optional}, path]},
	},

}), {n: 3})

expand(root)

export default root


// TODO: ast -> patches
// --- AST ----

const {path, id, block} = root

// astToken declaration

// expr.single.astTokenWrapperIs = true
// sp.astTokenNot = true


// astValueGet definitions

/* eslint no-whitespace-before-property:0  */
root								.astValueGet = (ctx, t)=> (astify(ctx, t.tokens[0]), t.tokens[0])

path								.astValueGet = (ctx, t)=> t.tokens.map(t=> (astify(ctx, t), t.type===id?t:t.astValue))
path.continuation		.astValueGet = (ctx, t)=> (astify(ctx, t.tokens[0]), t.tokens[0].type===block?t.tokens[0]:t.tokens[0].astValue)
path.component			.astValueGet = (ctx, t)=> (astify(ctx, t.tokens[1]), t.tokens[1])

block								.astValueGet = (ctx, t)=> astify(ctx, t.tokens[1])
block.list					.astValueGet = (ctx, t)=> t.tokens.map(t=> (astify(ctx, t), t.type===path?t:t.astValue))
block.continuation	.astValueGet = (ctx, t)=> (astify(ctx, t.tokens[t.tokens.length-1]), t.tokens[t.tokens.length-1])

id									.astValueGet = (ctx, t)=> t.match[0]
// id.astValueGet = (ctx, t)=> t.match[0]


// lexemsAstTypes definition

const prefix = true

export const astids = {
	other: {is: ()=> true, prefix},
}; astidsExpand(astids)


// --- EVAL ----

// const {plus} = astids

// astId.evaluate
// plus.evaluate = (ctx, t, args)=> args[0] + args[1]
root.evaluate = (ctx, t, args)=> evaluate(ctx, t.astValue)
path.evaluate = (ctx, t, args)=> {
	const patches = []
	const path = [...ctx.pathToPrepend||[]]
	t.astValue.map(t=>
			t.type===id? path.push(t.astValue)
		: t.type===block? patches.push(...evaluate(ctx, t)({path: [...path]}))
		: (()=> { throw new Error('path.evaluate: t.type.name: '+ t.type.name) })()
	)
	const isTop = ctx.isTop!==false
	const varId = path[path.length-1]
	patches.push(isTop
		? {path, valuePlaceholder: true}
		: {path, value: typeof ctx.vars[varId]!=='undefined'?ctx.vars[varId]: true})
	// log(lexemAstValueToPlain(t), 7)
	// log(ctx, 3)
	return patches
}
block.evaluate = (ctx, t, args)=> ({path})=>
	t.astValue.map(t=> evaluate({
		...ctx, pathToPrepend: path, isTop: false,
	}, t)).reduce((a, v)=> a.concat(v))


// token.type.evaluate
// text.evaluate = (ctx, t)=> t.astValue.map(t=> evaluate(ctx, t)).join('')
// text.raw.evaluate = (ctx, t)=> t.astValue
