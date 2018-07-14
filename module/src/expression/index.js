// expression/index.js
// LeonardPauli/rim
//
// Created by Leonard Pauli, mid jul 2018
// Copyright © Leonard Pauli 2018

import {log} from 'string-from-object'
import {lexemExtendCopyClean1Level} from '../parser/lexemUtils'
import {evaluateStr as evaluateStr_} from '../parser/evaluate'

import root from './lexems'
import './lexemsEvalExt'
import evalFns from './evalFns'

export {root}
export const evaluateStr = (str, ctx = exprCtxDefaultGet())=> evaluateStr_(ctx, str)

export const exprCtxDefaultGet = ({
	functions: evalFns,
} = {})=> ({
	lexem: lexemExtendCopyClean1Level(root.expr),
	vars: {},
	errors: [],
})
