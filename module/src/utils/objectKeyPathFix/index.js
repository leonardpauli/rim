// objectKeyPathFix.js
// rim
//
// created by Leonard Pauli, 4 aug 2018
// copyright © Leonard Pauli 2018

import sfo, {log} from 'string-from-object'
import {lexemExtendCopyClean1Level} from '../../parser/lexemUtils'
import {evaluateStr as evaluateStr_} from '../../parser/evaluate'

import root from './syntax'

export const evaluateStr = (str, ctx = exprCtxDefaultGet())=> evaluateStr_(ctx, str)

export const exprCtxDefaultGet = ({
	vars = {},
} = {})=> ({
	lexem: lexemExtendCopyClean1Level(root),
	vars,
	errors: [],
})

// const objectKeyPathFix = vars=> str=> {
// 	const ctx = exprCtxDefaultGet({vars})
// 	const val = evaluateStr(str, ctx)
// 	return val
// }

// export default objectKeyPathFix


export const patchesGet = (path, {vars = {}} = {})=> {
	const ctx = exprCtxDefaultGet({vars})
	evaluateStr(path, ctx)
	if (ctx.errors.length) {
		log(ctx.errors, 2)
		throw new Error('patchesGet: '+ctx.errors)
	}
	return ctx.lexem.evalValue
}

export const applyPatch = (patch, object, value)=>
	patch.path.reduce((o, k, i, all)=> {
		const isLast = all.length-1===i
		if (!o[k]) o[k] = {}
		if (!isLast) return o[k]
		const targetVal = patch.valuePlaceholder? value: patch.value
		if (!(typeof targetVal==='object' && targetVal)) return o[k] = targetVal
		if (Array.isArray(targetVal) && !Array.isArray(o[k]))
			o[k] = Object.assign([], o[k])
		if (Array.isArray(targetVal)) o[k].push(...targetVal)
		return o[k] = Object.assign(o[k], targetVal)
	}, object)
export const applyPatches = (patches, {object, value})=> patches
	.reduce((_, patch)=> applyPatch(patch, object, value), null)

const keyPathFix = (path, object, value, {vars} = {})=>
	applyPatches(patchesGet(path, {vars}), {object, value})

export const objectKeyPathFixedShallow = (o, {vars} = {})=>
	Object.keys(o).reduce((obj, k)=> (
		keyPathFix(k, obj, o[k], {vars}),
		obj
	), {})
