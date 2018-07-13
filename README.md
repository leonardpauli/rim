# rim
*Declarative + reactive language, parser + WIP eval*

See [leonardpauli.com](https://leonardpauli.com) for more.

__WIP__: will move more content/notes into this repo later on, very much work in progress :)

__Plan__:
- MVP declarative syntax
- ViewModuler *// adapter that creates frontend/UI from declarative structure*
- DataModuler *// adapter that creates backend from declarative structure*
- MVP on / do + state update
- connect those *// result: ability to create complete web apps (initially) using rim*
- fix syntax highlighting + linting (inc. fix) + watch mode w delta compile + updates
- later on: add / improve adapters *// eg. result: platform independent, wasm, llvm, etc*

__Long term__:
- fix graph db (maybe in collab with gunjs?) with goal to create a global decentralized (local decentralized using "trust", infinitely scalable (all data need not be everywhere), not global consensus like blockchain) normalised (there will only be one sofa, but that sofa might hava many connected "variants") graph database of all worlds knowledge and logic/processes (vision)
- rim lang is then a textual interface to this db
  - ability to represent graph structures well
  - ability to represent logic/processes declaratively, using graph structures, well
- finish the editor (then a visual interface to this db) (isomorphic to the lang to the db)

__Intro notes (preview)__:
- parents indicate "AST" grouping (~ no limitations)
- indentation indicate "blocks"
- do/on indicates events/actions, impure + imperative code 
- apart from that, the only type / syntax that exists is the Node type
- a node:
  - has properties (key-value map of nodes, unordered)
  - has input list (ordered list of nodes)
  - modifier function (takes its input list + its properties + an index)
  - output list (using modifier function, ordered list of nodes)
  - optional binary data store
- that is, a node is both an object, array, value, and function, at the same time
  - a "string" has its actual data in the binary data store
    - the modifier function then returns a list with the node itself, for every index
  - same for number
  - a list has the modifier function act as a proxy for the input list
    - where the input list is constructed at build time
  - a variable pointing to another is like a list with only one item
  - ranges, eg. 0,2.. has fn: `i=> i*2`
- all other syntax elements are just nodes
  - using the rim property, eg. alias to special characters can be made + pre/in/suffix + priority can be set.
  - `,` is an operator similar to haskells `:`, just building a list
  - `+` etc can be defined depending on context / block
- -> makes the language highly adaptable
- declarative, so order usually doesn't matter
  - evaluates as much as possible during compile time
  - tracks dependencies, so only what's absolutely necessary will be recomputed on events during runtime
- this is a higher level language than, eg. JavaScript
- there is no need for a strict mapping to harware


__Syntax overview (preview)__:
Syntax share similarities with ie. yaml, shell, c, haskell, javascript, css, etc:
    
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
    
    fruits: (apple, orange, banana) // list
    "an \(fruits.0) ate \(fruits.count) \(fruits.-1)" // "an apple ate 3 banana"


    # functions

    js: import "javascript" // ability to import "adapters" for other languages
    add1: js`x=> x+1` // ability to use other languages!
      // add1 is a javascript function that takes one variable
    six: add1 key // shell/haskell style
    six: add1 (key)
    six: add1(key) // also valid, c/javascript style
    six: key | add1 // (pipe)
    
    add: js`(a, b)=> a+b`
    six: add1 (add 2) 3 // partial application
    six: add1((add 2)(3)) // parents indicate "AST" grouping / what to do first
    six: add (2, 4) // multiple args (list) directly

    // functions like this has to be pure, to use side-effects/state:
    on start: do js`new Date()*1` // "do" can only be used inside "on" block
    // "start" event is triggered on program start
    // no impure code can be run during compile (safe, reliable, repeatable, etc)
    on ms.now: do js`new Date()*1`
    on delay: do js`ms=> new Promise(r=> setTimeout(r, ms))` // awaits promises
    on start:
      t: do ms.now
      do print "now \(t)" // with do, order matters (imperative)
      do: delay js`Math.random()*500` // in a sequence, do is only necessary once (TODO: actually wanted? how to unambiguously?)
      sub{alias{infix}: "-"}: js`(a,b)=> a-b` // add operators on the go
      do: print "later \(ms.now), diff: \(ms.now - t)"


    # ranges

    0..3, 0..<2, 0,2..7 // (0, 1, 2, 3), (0, 1), (0, 2, 4, 6)
    0,2.. | add1 | .(2..4) // (5, 7, 9), (lazy infinite list), (implicit dot notation / partial application), (access with ranges)


    # block syntax

    ' ball:
      color: "red"
      material:
        type: "paper"
        thickness{value: 5}
          unit: "mm"

    listAsBlock:
      - "first"
      - "second"
      someProperty: "in the middle"
      - "third"
    listAsBlock.someProperty // "in the middle"
    "\(listAsBlock.1), \(listAsBlock.2), \(listAsBlock.count)" // "second, third, 3"
    ' listAsBlock("first", "second"){someProperty: "in the middle"}("third")

    textBlock: "
      my text
      is multiline
        and nested
        with "quotes" inside
      to close it, just end the block...
    // ...by de-indenting (indentation inside block will be keept)


### Contribute

Feel free to fork and send PR's :)  
Will probably want a fair (you keep all the right of your code, but I also get all the rights in order to release the project under other licenses because this is WIP and I don't know which model to use yet) CLA, as well, then :)

Copyright © Leonard Pauli, 2016-2018

License: GNU Affero General Public License v3.0 or later.  
For commersial / closed-source / custom licencing needs, please contact us.  
Interesting discussion: https://github.com/pybee/paying-the-piper/issues/61
