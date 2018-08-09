// expression/stage-0-lexems.js
// LeonardPauli/rim
//
// Created by Leonard Pauli, 4 aug 2018
// Copyright © Leonard Pauli 2018

// OBS: see study/stages/stage-0-base.rim // current file should be a derivative from that canonical one

// TODO: keyfix{flags} `'a{c}.b{f}.r': v` -> a.c = true; a.b.f = true; a.b.r = v;
// TODO: `a.lexems: [...]; a.lexems.usingOr = true;` instead of just `a.lexems: [...]; a.usingOr = true`
// TODO: optional = {'keep-unmatched': true}
// TODO: lexem.(matcher{+ parents, regex}, state), etc
// TODO: lexem.stateGet // {type: line, stateGet: ({parents: [p]})=> ({depth: p.state.depth + 1}) }


import {log} from 'string-from-object'
import {
	stupidIterativeObjectDependencyResolve as declarative,
	objectKeyDotNotationResolveShallow as keyfix,
} from '@leonardpauli/utils/lib/object'

import {flags, expand} from '../parser/lexemUtils'
const {optional, repeat, usingOr} = flags


// helpers
const regexCharsetEscape = xs=> {
	const needsEscape = '[]^\\'
	xs = xs.map(x=> needsEscape.indexOf(x)>=0?'\\'+x: x)
	const hasDash = xs.indexOf('-')>=0
	if (hasDash) (xs = xs.filter(x=> x!='-')).push('-') // ensure dash is last
	return xs
}

const anyGet = ({except = ['\n'], m = false, i = false, ...rest} = {})=> ({
	regex: new RegExp(`[^${regexCharsetEscape(except).join('')}]`, (m?'m':'')+(i?'i':'')),
	...rest,
})



// singleline
const singlelineGet = ({multiline})=> declarative(({
	// lexems, paren, num, sp, spo, expr, text, dot, comma, id,
	any, newline, backslash,

	content,
	space,
	comment,
	expression, number, string, identifier,
})=> keyfix({

	// misc
	any: anyGet(),
	'newline.regex': /^\n/,
	'backslash.regex': /^\\/,

	// syntax
	lexems: [space.none, content.wrap],
	'content.wrap': keyfix({
		'after-space.lexems{usingOr}': [comment.eol],
		'alone.lexems{usingOr}': [space.none],
		'lexems{usingOr}': [[content, {type: space.one, required: true}, content.wrap['after-space']], content.wrap.alone],
	}),

	'content.lexems{usingOr}': [comment['top-level'], expression],

	// space
	space: keyfix({
		regex: /^ /,
		'tab.regex': /^\t/,
		indent: {
			'lexems{usingOr}': [space.indent, space.indent.space],
			'space.regex': /^\t/,
			'only.lexems{usingOr}': [space.indent, space],
		},
		'any.lexems{usingOr}': [space, space.tab],
		'none{optional}.lexems{repeat}': [space.any],
		one: keyfix({
			// TODO: see required + lintng
			optional, // optional
			// not optional: optional{keep-unmatched}
			'lexems{repeat}': [space.any],
		}),
	}),

	// comment
	comment: keyfix({
		'initial-spacing': {
			lexems: [{type: space.one, required: true}, {type: space.indent.only, optional, repeat}],
		},
		'top-level': keyfix({
			'start.regex': /^#/,
			content: keyfix({
				'default.lexems': [any],
				lexems: [comment['initial-spacing'], {type: comment['top-level'].content.default, optional}],
			}),
		 	lexems: [comment['top-level'].start, comment['top-level'].content],
		}),
		eol: keyfix({
			'indicator.regex': /^\/\//,
			lexems: [comment.eol.indicator, comment['initial-spacing'], {type: any, optional}],
		}),
	}),

	// expression
	expression: keyfix({
		lexems: [expression.content, {lexems: [{type: space.one, optional}, expression.content], repeat, optional}],
		'content.lexems{usingOr}': [
			number, string,
			identifier.special, identifier,
		],
	}),

	// identifier
	identifier: identifierGet,

	// number
	number: keyfix({
		// 0, -7, 40.03, 1_000.005_300 (zeros at end are recorded for precision)
		'leading-zeros': /^0[0_]*/,
		'whole-part': keyfix({
			'lexems{usingOr}': [number['whole-part']['zero-only'], number['whole-part']['zero-only-not']],
			'zero-only.regex': /^0(?=[^0-9])/,
			'zero-only-not': {
				lexems: [{type: number['leading-zeros'], optional}, {type: number['whole-part']['natural-number'], optional: {'keep-unmatched': true}}],
			},
			'natural-number.regex': /^[1-9][0-9_]*/,
		}),
		'decimal-part': keyfix({
			lexems: [number['decimal-part'].decimal, number['decimal-part'].digits],
			decimal: /^\./,
			digits: /^[0-9_]+/,
		}),
		'sign-negative': /^-/,
		lexems: [{type: number['sign-negative'], optional}, number['whole-part'], {type: number['decimal-part'], optional}],
	}),

	// string
	string: stringGet({newline, backslash, multiline, any}),

}), {n: 3})



// singleline subs

// identifier
const identifierGet = ()=> {
	const identifierSpecialChars = ', . : ; - @ #'.split(' ')
	const middleList = [...' (){}.'.split(''), ...identifierSpecialChars.filter(x=> x!='-')]
	const endList = [...new Set([...middleList, ...identifierSpecialChars])]
	const startList = [...endList, '0-9']

	return declarative(({ identifier }, {
		start, tail, middle, end,
	} = identifier)=> keyfix({
		identifier: keyfix({
			lexems: [start, {type: tail, optional, repeat}],
			start: anyGet({except: startList}),
			// to allow `a-b-c` as identifier (sure? possibly ambiguous with a - b - c?)
			'tail.lexems': [{type: middle, optional, repeat}, {type: end, repeat}],
			middle: anyGet({except: middleList}),
			end: anyGet({except: endList}),
		}),
		'identifier.special': keyfix({
			'any.regex': new RegExp(`[${regexCharsetEscape(identifierSpecialChars).join('')}]+`),
			'lexems{usingOr}': [identifier.special.any],
		}),
	}), {n: 3}).identifier
}


// string
const stringGet = ({backslash, newline, multiline, any})=> declarative(({ string }, {
	open, close, content, line, escaped,
} = string.default)=> ({ string: keyfix({
	'lexems{usingOr}': [string.default],
	default: keyfix({
		open: /^"/,
		close: /^"/,
		lexems: [open, {type: content, repeat, optional}, {type: close, optional: {'keep-unmatched': true}}],
		content: keyfix({
			'lexems{usingOr}': [line, escaped, content.raw],
			raw: anyGet({except: ['"']}),
		}),
		'content.block': {...content, raw: any},

		line: keyfix({
			lexems: [line.start, line.content.wrapper],
			'content.wrapper.lexems{usingOr}': [multiline.line.spacer, line.content],

			'content.lexems': [line.indent, content.block],
			start: keyfix({
				'lexems{usingOr}': [line.start['escaped-new-line'], newline],
				'escaped-new-line.lexems': [backslash, newline],
			}),
			'indent.lexems': [multiline.line.indent.outside, multiline.line.indent],
		}),

		escaped: keyfix({
			start: /^\\/,
			lexems: [escaped.start, escaped.content],
			'content.lexems{usingOr}': [escaped.start, any], // insert{after: start}: expression.paren
		}),
	}),
}) }), {n: 3}).string



// multiline
const multilineGet = ()=> declarative(({ multiline }, {
	document, singleline, EOF, line, end, comment,
} = multiline)=> ({ multiline: keyfix({

	// misc
	EOF: {optional: {'keep-unmatched': true}, regex: /^$/},
	'end.lexems{usingOr}': [singleline.newline, EOF],
	
	// entrypoint
	lexems: [document],
	document: {
		lexems: [document.line],
		line: keyfix({...line, 'state.depth': 0, lexems: [line.indent.inside]}), // is line?
	},

	// comment.block
	comment: multilineCommentGet({space: singleline.space, singleline, line, end}),
	
	// line
	line: multilineLineGet({singleline, end, comment}),

	// singleline
	singleline: singlelineGet({multiline}),

}) }), {n: 3}).multiline



// multiline subs

// comment.block
const multilineCommentGet = ({space, singleline, line, end})=> declarative(({ comment }, {
	start, prim, content,
} = comment.block.default)=> keyfix({ 'comment.block': keyfix({
	
	'lexems{usingOr}': [comment.block.default, comment.block.string],
	default: keyfix({
		lexems: [start, {type: content, optional: {'keep-unmatched': true}}],
		start: [prim, space.one],
		prim: /^'/,
		content: keyfix({
			lexems: [{type: content.line, repeat}],
			'line.lexems{usingOr}': [line.spacer, content.line.content.wrapper],
			'line.content.wrapper': [line.indent.outside, {type: content.line.content, optional}, end],
			'line.content': /^[^\n]+/,
		}),
	}),
	'string.lexems': [prim, singleline.string],

}) }), {n: 3}).comment


// line
const multilineLineGet = ({singleline, end, comment})=> declarative(({ line }, {
	spacer, ghostwrapper, indent, subline, content,
} = line)=> ({ line: keyfix({
	
	'state.depth': 0, // is Int, TODO: don't initialize, error if use uninitialized
	'lexems{usingOr}': [spacer, ghostwrapper],
	
	spacer: keyfix({
		lexems: [{type: spacer['whitespace-horizontal'], repeat, optional}, end],
		'whitespace-horizontal.regex': /^( |\t)/,
	}),

	ghostwrapper: keyfix({
		'lexems{usingOr}': [ghostwrapper.ghostline, line.inside],
		'ghostline.lexems': [indent, ghostwrapper],
	}),

	'inside.lexems': [content, {type: subline, repeat, optional}],

	'subline.lexems': [indent.outside, {type: line, stateGet: ({parents: [p]})=> ({depth: p.state.depth + 1}) }], // TODO
	'indent.regex': /^(  |\t)/,
	'indent.outside.matcher': ({parents: [p], regex})=> p.state.depth==0? {matched: true}: regex(`^(  |\t){${p.state.depth}})`), // TODO

	'content.lexems{usingOr}': [comment.block, singleline],

}) }), {n: 3}).line

const multiline = multilineGet()
export default multiline