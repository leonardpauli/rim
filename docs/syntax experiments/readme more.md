    # top-level line comment
    code // end-of-line comment
    ' block-comment
    	still in comment block

    key: value
    value: 5 // order doesn't matter, declarative!
    greeting: "Hello" // text type (currently with a "string" value)
    phrase: "\(greeting) \(value)!" // phrase is "Hello 5!" (interpolation)

    ball: {color: "red", material.type: "paper"} // properties
    ball.material.thickness{value: 5, unit: "mm"} // extend properties
    // same as: (using indentation to define / nest "blocks")
    ball:
    	color: "red"
    	material:
    		type: "paper"
    		thickness:
    			value: 5
    			unit: "mm"
    
    fruits: (apple, orange, banana) // list
    "an \(fruits.0) ate a \(fruits.-1)" // "an apple ate a banana"
    	' index starts at 0, ie. list.0 is the first item in the list
    		list.1 is the second (orange), etc
    		negative numbers gets from the end, ie. list.-1 is the last one
    		list.-2 is the second last one (in this case, also orange)
    fruits.count // 3
    fruits.myFruitIndex: 2
    myFruitIndex: 1
    fruits.(myFruitIndex) // "orange", use parents to indicate priority
    fruits.myFruitIndex // 2
    fruits.(fruits.myFruitIndex) // "banana"

    listAsBlock:
    	- "first"
    	- "second"
    	someProperty: "in the middle"
    	- "third"
    listAsBlock.someProperty // "in the middle"
    "\(listAsBlock.1), \(listAsBlock.2), \(listAsBlock.count)" // "second, third, 3"
    ' same as all the following:
      - listAsBlock("first", "second"){someProperty: "in the middle"}("third")
      - listAsBlock("first", "second", "third"){someProperty: "in the middle"}
      - listAsBlock{someProperty: "in the middle"}("first", "second", "third")
      - listAsBlock{someProperty: "in the middle"}("first", "second")
      	- "third"

    js: import "javascript" // ability to import "adapters" for other languages

    add1: js`x=> x+1` // ability to use other languages!
    	// add1 is a javascript function that takes one variable
    six: add1 key
    	' also six:
    		6
    		js`6`
    		js`x=> 6` "some random unused value"
    		js`x=> x` 6
    		js`x=> x+1` 5
    		js`x=> x+1` value // value: 5, see above
    		js`x=> x+1` key // key: value, see above
    		add1: js`x=> x+1`; add1 key // just put a name to it

    js: import "javascript" // ability to import "adapters" for other languages
    add1: js`x=> x+1` // ability to use other languages!
        // add1 is a javascript function that takes one variable
    six: add1 key // shell/haskell style
    six: add1 (key)
    six: add1(key) // also valid, c/javascript style
    
    add: js`(a, b)=> a+b`
    addTwo: add 2 // partial application
    six: add1 add2 3
    six: add1(add2(3)) // parents indicate "AST" grouping / what to do first
    six: 3 | add2 | add1 // (pipe)
    six: add (2, 4)
    six: (add 2) 4
    six: 4 | add 2

    textBlock: "
    	my text
    	is multiline
    		and nested
    		with "quotes" inside
    	to close it, just end the block...
    // ...by de-indenting (indentation inside block will be keept)
    textBlockExample: "

    	a
    		b\
    	c\n\td"e


    ' same as "\na\n\tbc\n\td\"e"
    	note:
    		- one, not two leading new lines
    		- \t before b
    		- no new line between b and c
    		- " between d and e is keept intact
    		- no trailing new line
    textBlockExample2: "hi \
    	hello
    // same as "hi hello"
    textBlockExample3: "\n\
    	hello
    // same as "\nhello"
    textBlockExample4: "hi
    	hello
    // same as "hi\n\thello"