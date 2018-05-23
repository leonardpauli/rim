// $lpdocs/app/misc/.eslint.js
// Created by Leonard Pauli, 2017-2018
// javascript style rules
// 
/* see https://eslint.org/docs/user-guide/configuring
install:
	see app/node/registry.npm."package.json"
	- cp $lpdocs/app/misc/.eslintrc.js ./
	to json:
		- package-json-script-add '"lint:compile": "echo \"'"require('fs').writeFileSync('.eslintrc', JSON.stringify(require('./.eslintrc.js')), 'utf-8')"'\" | node"'
		- npm run lint:compile
	watch script:
		- npm i -D onchange
		- lint_glob='{{src}/**,.}/*.{vue,js}'
		- package-json-script-add '"lint:watch": "onchange '"'$lint_glob'"' -d 200 -w -- npm run --silent lint {{changed}}"'
	eslint:
		- npm i -D eslint eslint-plugin-vue babel-eslint
		- package-json-script-add '"lint": "eslint --fix '"'$lint_glob'"'"'
*/ 


/* eslint max-lines:0, import/no-commonjs:0, import/no-nodejs-modules:0 */

/* global process */
// eslint-disable-next-line no-process-env
const isProduction = process.env.NODE_ENV === 'production'
const isRoot = true
const allowConsoleLog = true
const useVue = true
const useReact = false
const useImport = false
const useImportWebpackResolve = false
const useImportNoCommonjs = false
const useFlow = false
const useNode = false


// TODO:
// - error should only be on potential issues, not formatting)
// - https://github.com/thejameskyle/babel-plugin-react-flow-props-to-prop-types
// - "Severity should be one of the following: 0 = off, 1 = warning, 2 = error"
// - make more modular


module.exports = {
	root: isRoot,
	parserOptions: {
		parser: 'babel-eslint',
		sourceType: 'module',
		// ecmaVersion: 2018,
	},
	env: Object.assign({
		browser: true,
		// es6: true,
	}, useNode? {
		node: true,
	}:{}),
	extends: useVue? ['plugin:vue/recommended']: 'eslint:recommended',
		// required to lint *.vue files
	plugins: [
		useVue && 'vue',
		useReact && 'react',
		useReact && 'jsx-a11y',
		useImport && 'import',
		useFlow && 'flowtype',
		// 'prefer-object-spread',
	].filter(function (a) {return !!a}),
	// check if imports actually resolve
	settings: Object.assign({}, useImportWebpackResolve && {
		'import/resolver': {
			webpack: {
				config: 'build/webpack.base.conf.js',
			},
		},
	} || {}),
	rules: Object.assign({

		'no-underscore-dangle': ['off', { allowAfterThis: true }],


		'accessor-pairs': 'error',
		'array-bracket-spacing': 'warn',
		'array-callback-return': 'warn',
		'arrow-body-style': 'warn',
		'arrow-parens': ['warn', 'as-needed'],
		'arrow-spacing': ['warn', {
			before: false,
			after: true,
		}],
		'block-scoped-var': 'error',
		'block-spacing': ['warn', 'always'],
		'brace-style': ['warn', '1tbs', {
			allowSingleLine: true,
		}],
		'callback-return': 'error',
		camelcase: ['error', {properties: 'never'}],
		'capitalized-comments': 'off',
		// "capitalized-comments": ["warn", "never", {
		// 	//"ignorePattern": "pragma|ignored",
		//     "ignoreInlineComments": true,
		//     ignoreConsecutiveComments: true,
		//   }],
		'class-methods-use-this': 'off',
		// would have been neat with a better way of indicating that it is wanted
		// 	(in super)
		// ['warn', { exceptMethods:
		// 	['getStateUpdates', 'render'],
		// }],
		'comma-dangle': ['warn', 'always-multiline'],
		'comma-spacing': ['warn', { before: false, after: true }],
		'comma-style': ['error', 'last'],
		complexity: ['error', { max: 20 }],
		'computed-property-spacing': ['error', 'never'],
		'consistent-return': 'off', // would like consistant having a return
		// statement or not, while allowing different return types
		// 'consistent-return': ['warn', {
		// 	"treatUndefinedAsUnspecified": true,
		// }],
		'consistent-this': ['error', 'self'],
		// 'curly': ['warn', "multi-line"], // would like:
		// - single line if short
		// - single under if one but longer
		// - brackets if multi-line
		curly: 'off',
		'default-case': 'error',
		'dot-location': ['error', 'property'],
		'dot-notation': ['error', {
			allowKeywords: true,
		}],
		'eol-last': ['warn', 'always'],
		eqeqeq: 'off', // TODO
		'func-call-spacing': 'error',
		'func-name-matching': 'error',
		'func-names': ['warn', 'as-needed'],
		'func-style': ['error', 'expression'],
		'generator-star-spacing': ['error', {
			before: false,
			after: true,
		}],
		'global-require': 'off',
		'guard-for-in': 'error',
		'handle-callback-err': 'error',
		'id-blacklist': 'error',
		'id-length': 'off',
		// 'id-length': ['warn', {
		// 	min: 2, max: 40,
		// 	exceptions: ['x', 'e', 'y', 'i', 'k', 'v', 'w', ''],
		// }],
		'id-match': 'error',
		indent: ['warn', 'tab', {
			// MemberExpression: 0,
			SwitchCase: 1,
			FunctionDeclaration: {body: 1, parameters: 1},
			CallExpression: {arguments: 1},
			ArrayExpression: 1,
			ObjectExpression: 1,
		}],
		
		'init-declarations': 'off', // want: discourage use of let, but in some situations,
		// ie callbacks ref capturing, you usually want to initialize to undefined...

		'jsx-quotes': ['warn', 'prefer-double'],
		'key-spacing': ['warn', {mode: 'minimum'}],
		'keyword-spacing': ['error', { before: true, after: true }],
		'line-comment-position': 'off',
		'linebreak-style': ['error', 'unix'],
		'lines-around-comment': 'warn',
		'lines-around-directive': 'warn',
		'max-depth': ['error', 4],
		'max-len': [0, { // TODO: 1
			tabWidth: 2,
			code: 100,
			ignoreTrailingComments: true,
		}],
		'max-lines': ['warn', 1350], // TODO: 350
		'max-nested-callbacks': ['error', { max: 4 }],
		'max-params': ['warn', 5],
		'max-statements': ['warn', 30, { ignoreTopLevelFunctions: true }],
		'max-statements-per-line': ['warn', { max: 4 }],
		'multiline-ternary': 'off',
		'new-cap': 0, // TODO: 1
		'new-parens': 'error',
		'newline-after-var': 'off', // maybe? not in tiny places
		'newline-before-return': 'off', // maybe? not in tiny places
		// should be constrained by line length
		// ie. if line is "}).reverse()", it should be ok even if there
		// where 100 chained calls before
		'newline-per-chained-call': ['warn', { ignoreChainWithDepth: 4 }],
		'no-alert': 'error',
		'no-array-constructor': 'error',
		'no-await-in-loop': 'warn',
		// if Promisify.all([...]) is possible, use it instead.
		// If each iteration relies on value from prev, then it is ok.
		'no-bitwise': 'error',
		'no-caller': 'error',
		'no-catch-shadow': 'error',
		'no-compare-neg-zero': 'error',
		'no-confusing-arrow': 'off', // solved by arrow-spacing fn=> ...
		// allow debugger during development
		'no-debugger': isProduction ? 2 : 0,
		// TODO: error in env production
		'no-console': isProduction
			? ['error', { allow: ['warn', 'error'] }]
			: ['warn', { allow: [
				'warn', 'error',
				'ignoredYellowBox', 'disableYellowBox', // for react native
				...!allowConsoleLog?[]:['log', 'dir'],
			] }],
		'no-constant-condition': 'warn',
		'no-continue': 'off', // buu
		'no-div-regex': 'error',
		'no-duplicate-imports': 'error', // hmm.. propably good
		'no-else-return': 'warn',
		'no-empty-function': ['warn'],
		'no-empty': ['warn'],
		'no-eq-null': 'error',
		'no-eval': 'error',
		'no-extend-native': 'error',
		'no-extra-bind': 'error',
		'no-extra-boolean-cast': 'warn',
		'no-extra-label': 'error',
		// 'no-extra-parens': 'off', // Want; but flow type casting (value: DestinationType)
		// - just `// eslint-ignore-line no-extra-parens`
		// 	at those rare lines; should be avoided anyways
		'no-extra-parens': ['warn', 'all', {
			nestedBinaryExpressions: false,
			returnAssign: false,
			ignoreJSX: 'multi-line',
		}],
		'no-floating-decimal': 'error',
		'no-implicit-globals': 'error',
		'no-implied-eval': 'error',
		'no-inline-comments': 'off', // warn, except for ()=> { /**/ } and short ones
		'no-invalid-this': 'off', // eg. export default function () {this...}
		'no-iterator': 'error',
		'no-label-var': 'error',
		'no-labels': 'error',
		'no-lone-blocks': 'error',
		'no-lonely-if': 'error',
		'no-loop-func': 'error',
		'no-magic-numbers': 'off',
		// would be neat, although not for react styling
		// 'no-magic-numbers': ['warn', {ignore:[1,0,2]}],
		'no-mixed-operators': 'off', // would be good to have for ie: a || b && c || d
		'no-mixed-requires': 'error',
		'no-multi-assign': 'off',
		'no-multi-spaces': 'warn',
		'no-multi-str': 'error',
		'no-native-reassign': 'error',
		'no-negated-condition': 'off', // good for ()=> !condition ? short : long
		'no-negated-in-lhs': 'error',
		'no-nested-ternary': 'off', // almost.. but nah..
		'no-new': 'error',
		'no-new-func': 'error',
		'no-new-object': 'error',
		'no-new-require': 'error',
		'no-new-wrappers': 'error',
		'no-octal-escape': 'error',
		'no-param-reassign': 'off', // when fixing default values multilevel (single level handled like fn(a=3))
		'no-path-concat': 'error',
		'no-plusplus': 'off',
		// ['warn', { allowForLoopAfterthoughts: true, }],
		'no-process-env': 'off', // TODO
		'no-process-exit': 'error',
		'no-proto': 'error',
		'no-prototype-builtins': 'off',
		'no-restricted-globals': 'error',
		'no-restricted-imports': 'error',
		'no-restricted-modules': 'error',
		'no-restricted-properties': 'error',
		'no-restricted-syntax': 'error',
		'no-return-assign': 'off',
		'no-return-await': 'error', // `async ()=> await x` === `async ()=> x`
		'no-script-url': 'error',
		'no-self-compare': 'error',
		'no-sequences': 'off',
		'no-shadow': 'off', // like to allow overwrite by fn arguments, but otherwise no?
		'no-shadow-restricted-names': 'error',
		'no-spaced-func': 'error',
		'no-sync': 'error',
		'no-tabs': 'off',
		'no-template-curly-in-string': 'error',
		'no-ternary': 'off',
		'no-throw-literal': 'error',
		'no-trailing-spaces': ['error', {
			skipBlankLines: true,
		}],
		'no-undef-init': 'error',
		'no-undefined': 'off', // best to just write undefined in ES5
		'no-undef': 'error',
		'no-unmodified-loop-condition': 'error',
		'no-unneeded-ternary': 'error',
		'no-unreachable': 'warn',
		'no-unused-expressions': ['off', { // ie. a |> b |> c
			allowShortCircuit: true,
			allowTernary: false,
		}],
		'no-use-before-define': ['error', { variables: false }],
		'no-useless-call': 'error',
		'no-useless-computed-key': 'error',
		'no-useless-concat': 'error',
		'no-useless-constructor': 'off',
		'no-useless-escape': 'error',
		'no-useless-rename': 'error',
		'no-useless-return': 'warn',
		'no-var': 'error',
		'no-void': 'off', // used like: return void fn(); // calls fn, then returns undefined
		'no-warning-comments': 'off', // maybe before going into
		// staging... good notes for future work though
		'no-whitespace-before-property': 'error',
		'no-with': 'error',
		'nonblock-statement-body-position': ['error', 'any'],
		'object-curly-newline': 'off', // TODO maybe
		'object-curly-spacing': 'off', // TODO maybe
		'object-property-newline': 'off',
		// the following would be disallowed:
		// ['error', {
		// 	allowMultiplePropertiesPerLine: true,
		// }],
		// ie. if an object starts/ends on different lines, those should be counted as the same line
		// 	so if allowMultiplePropertiesPerLine is on, it usually means:
		// [a, {b: 2, d: 3}, c] // allowed
		// [a, {b: 2, d: 3}, \n c] // not allowed
		// [a, {\nb: 2,\n d: 3\n}, c] // I would like to allow this
		'object-shorthand': ['warn'],
		'one-var': 'off', // maybe, but not in tiny block
		'one-var-declaration-per-line': 'error',
		'operator-assignment': 'error',
		'operator-linebreak': ['warn', 'after', {
			overrides: {
				'||': 'before',
				'&&': 'before',
				':': 'ignore',
				'?': 'before',
			},
		}],
		'padded-blocks': 'off', // 'never', yes, but not if tiny block or first line is comment
		'prefer-arrow-callback': 'warn',
		'prefer-const': 'warn',
		'prefer-destructuring': ['warn', {
			VariableDeclarator: {
				array: true,
				object: true,
			},
			AssignmentExpression: {
				array: false,
				object: false,
			},
		}, {
			enforceForRenamedProperties: false,
		}],
		'prefer-numeric-literals': 'error',
		'prefer-promise-reject-errors': 'error',
		'prefer-reflect': 'off',
		'prefer-rest-params': 'error',
		'prefer-spread': 'error',
		'prefer-template': 'off', // TODO: would be nice in some cases...
		'quote-props': ['error', 'as-needed', { numbers: true }],
		quotes: ['warn', 'single', { allowTemplateLiterals: true }],
		radix: 'error',
		'require-await': 'off', // nope, better to write async ()=> x than ()=> Promise.resolve(x), etc
		'require-jsdoc': ['warn', {require: {
			FunctionDeclaration: false,
			MethodDefinition: false,
			ClassDeclaration: false, // TODO: set to true when time allows
			// + get jsdoc plugin for editor + auto doc generator
		}}],
		'rest-spread-spacing': 'error',
		semi: ['error', 'never'],
		'no-unexpected-multiline': 'warn',
		'semi-spacing': ['error', {
			after: true,
			before: false,
		}],
		'sort-imports': 'off',
		'sort-keys': 'off',
		'sort-vars': 'error',
		'space-before-blocks': 'error',
		'space-before-function-paren': ['warn', 'always'],
		'space-in-parens': ['warn', 'never'],
		// sometimes nice to be able to group with space if many nested ie. }) )] ) )
		'space-infix-ops': 'off',
		'space-unary-ops': 'error',
		'spaced-comment': ['warn', 'always', {
			line: {
				markers: ['/', ':'],
			},
			block: {
				markers: ['!', ':'],
				exceptions: ['*', '::'],
				balanced: true,
			},
		}],
		strict: 'error',
		'symbol-description': 'error',
		'template-curly-spacing': 'error',
		'template-tag-spacing': 'error',
		'unicode-bom': ['error', 'never'],
		'valid-jsdoc': 'warn',
		'vars-on-top': 'error',
		'wrap-iife': 'error',
		'wrap-regex': 'error',
		'yield-star-spacing': 'error',
		yoda: ['error', 'never', { exceptRange: true }],


		// added
		'no-multiple-empty-lines': ['warn', { max: 3, maxEOF: 0, maxBOF: 0 }],
		
		// misc
		/*
		'prefer-object-spread/prefer-object-spread': 2,
		*/


	}, useImport? {
		'import/named': 2,
		'import/no-unresolved': 'warn',
		'import/default': 2,
		'import/namespace': 2,
		'import/export': 2,
		'import/first': 'warn',
		'import/no-duplicates': 2,
		'import/prefer-default-export': 0,
		'import/no-commonjs': useImportNoCommonjs? 0: 2,
		'import/no-amd': 2,
		'import/no-nodejs-modules': 2,
		'import/extensions': ['error', 'never', { js: 'never' }],
		// allow optionalDependencies
		// 'import/no-extraneous-dependencies': ['error', {
		// 	optionalDependencies: ['test/unit/index.js'],
		// }],


	}:{}, useReact? {
		'react/prop-types': 2, // TODO
		// 'no-unused-vars': 'off', // TODO
		'no-unused-vars': ['warn', {
			argsIgnorePattern: '(Expo)|(nextState)|(prevState)|^_',
		}],
		'react/jsx-uses-vars': 'warn',

		// crashed on type x = {...otherType}
		'react/default-props-match-prop-types': ['warn', { allowRequiredDefaults: false }],

		'react/jsx-curly-spacing': ['warn', 'never'],
		'react/jsx-key': 2,
		'react/jsx-no-comment-textnodes': 2,
		'react/jsx-no-duplicate-props': 2,
		'react/jsx-no-target-blank': 2,
		'react/jsx-no-undef': 2,
		'react/jsx-uses-react': 2,

		'react/display-name': 2,
		'react/no-children-prop': 2,
		'react/no-danger-with-children': 2,
		'react/no-deprecated': 2,
		'react/no-direct-mutation-state': 2,
		'react/no-find-dom-node': 2,
		'react/no-is-mounted': 2,
		'react/no-render-return-value': 2,
		'react/no-string-refs': 2,
		'react/no-unescaped-entities': 2,
		'react/no-unknown-property': 2,
		'react/react-in-jsx-scope': 2,
		'react/require-render-return': 2,


	}:{}, useFlow? {
		// https://github.com/gajus/eslint-plugin-flowtype
		// TODO: go through, config, and fix
		'flowtype/boolean-style': [1, 'boolean'],
		'flowtype/define-flow-type': 1,
		'flowtype/delimiter-dangle': [1, 'always-multiline'],
		'flowtype/generic-spacing': [1, 'never'],
		'flowtype/no-primitive-constructor-types': 2,
		'flowtype/no-types-missing-file-annotation': 2,
		// 'flowtype/no-weak-types': 2,
		'flowtype/object-type-delimiter': [1, 'comma'],
		// 'flowtype/require-parameter-type': 2,
		// 'flowtype/require-return-type': ['warn', 'always', {
		// 	annotateUndefined: 'never',
		// 	excludeArrowFunctions: true,
		// }],
		'flowtype/require-valid-file-annotation': 2,
		'flowtype/semi': [2,	'never'],
		'flowtype/space-after-type-colon': [1,	'always'],
		'flowtype/space-before-generic-bracket': [1,	'never'],
		'flowtype/space-before-type-colon': [1,	'never'],
		// 'flowtype/type-id-match': [2,	'^([A-Z][a-z0-9]+)+Type$'],
		'flowtype/union-intersection-spacing': [1, 'always'],
		'flowtype/use-flow-type': 1,
		'flowtype/valid-syntax': 1,


	}:{}, useVue? {
		'vue/max-attributes-per-line': 'off',
		'vue/require-default-prop': 'off',

		
	}:{}),
}
