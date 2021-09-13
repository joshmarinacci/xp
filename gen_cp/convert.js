import ohm from 'ohm-js'
import fs from 'fs'

let grammar = ohm.grammar(`
easy {
    Exp = File | OnBlock | Block | FuncallExp | ident | number | string | comment
    File = OnBlock+
    Block = "{" Exp* "}"
    OnBlock = "on" OnKeyword "do" Block
    OnKeyword = "forever" | "button_clicked"
    ident  (an identifier)
        = letter (letter | digit | under)*
    number  (a number)
        = digit+
    under = "_"
    q = "\\'"
    qq = "\\""
    comment = "#" toEOL
    toEOL = (~"\\n" any)* "\\n" 
    
    string (text string)
        = q (~q any)* q
        | qq (~qq any)* qq
    FuncallExp = ident "(" ListOf<Exp,","> ")"
}   
`)


let semantics = grammar.createSemantics()

function l(...args) {
    log(...args)
}

semantics.addOperation('toPython', {
    number:(a) => parseInt(a.sourceString),
    string:(a,b,c)=>`"${b.sourceString}"`,
    FuncallExp:(a,b,c,d) => ({type:"funcall", name:a.toPython(), args:c.asIteration().children.map(x => x.toPython())}),
    Block:(a,c,d) => ({type:'block',contents:c.toPython()}),
    OnBlock:(a,b,c,d) => ({type:'on',kind:b.toPython(), block:d.toPython()}),
    ident:(a,b) => a.sourceString + b.sourceString,
    _iter:(children) => children.map(c => c.toPython()),
    _terminal:function() { return this.sourceString },
    comment:(h,a) => ({type:'comment', comment:a.sourceString}),
})

function log(...args) {
    console.log(...args)
}

function test(str) {
    log("parsing",str)
    let res = grammar.match(str,)
    if(!res.succeeded()) {
        log('failed',res)
    }
    // log("succeeded")
    log(semantics(res).toPython())
}

function run_tests() {
    test(`1`)
    test(`45`)
    test(`"foo"`)
    test(`'foo'`)
    test(`foo(5)`)
    test(`press("E")`)
    test(`keyboard_press('E')`)
    test(`on forever do { 5 }`)
    test('{ foo(5) } ')
    test(`on forever do { print("bob") }`)
    test(`
    on button_clicked do {
        modes_next()
    }
    `)
    test(`
    on forever do {
        keyboard_press('E')
        wait(1)
        keyboard_releaseAll()
        wait(60)
    }
    `)

    test(`on forever do {
        mouse_press('left')
        wait(5)
        mouse_releaseAll()
    }`)
    test(`#foo
    `)

    test(`
on forever do {
    keyboard_press('E')
    wait(1)
    keyboard_releaseAll()
    wait(60)
}
on forever do {
    mouse_press('left')
    wait(5)
    mouse_releaseAll()
}
`)
    // test(`
    // on start do {
    //     print("starting")
    //     #   modes := ring()
    //     #   modes.add(
    // }
    // `)
}

// run_tests()

let indent_level = 0
function indent() {
    indent_level++
}
function outdent() {
    indent_level--
}
function tab() {
    let str = ""
    for(let i=0; i<indent_level; i++) {
        str += "   "
    }
    return str
}
function make_function(ast) {
    if(ast.name === 'wait') return line(`yield ${ast.args[0]}`)
    return line(`${ast.name}(${ast.args.join(",")})`)
}

function line(str) {
    return `${tab()}${str}\n`
}

function make_on_block(ast,out) {
    let name = `task_${Math.floor(Math.random()*100000)}`
    out(line(`def ${name}():`))
    indent()
    out(line("while True:"))
    indent()
    out(`${ast.block.contents.map(make_function).join("")}`)
    outdent()
    outdent()
    out(line(`tm.register('${name}',${name},False)`))
    out(line(""))
}

function generate_python(ast,out) {
    ast.forEach(task => make_on_block(task,out))
}

function generate(str,out) {
    let res = grammar.match(str)
    if(!res.succeeded()) return log('failed',res)
    let ast = semantics(res).toPython()
    generate_python(ast,out)
}

async function doGenerate() {
    let output = []
    function out(str) {
        // console.log("outputting",...args)
        output.push(str)
        // output += [...args].join("\n")
    }
    let prelude = await fs.promises.readFile("prelude.py")
    out(prelude.toString())

    generate(`
on forever do {
    print("pressing E")
    keyboard_press('E')
    wait(1)
    keyboard_releaseAll()
    print("waiting 60")
    wait(60)
}

on forever do {
    print("doing second")
    mouse_press('left')
    print("waiting 30")
    wait(30)
    mouse_releaseAll()
}
`,out)
    let postlude = await fs.promises.readFile("postlude.py")
    out(postlude.toString())
    console.log(output.join(""))
    await fs.promises.writeFile("code.py",output.join(""))
}

// run_tests()
doGenerate()
