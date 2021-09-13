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

function make_button_clicked(ast, out) {
    let name = `task_${Math.floor(Math.random()*100000)}`
    out.line(`def ${name}():`)
    indent()
    out.line("global button")
    out.line("global button_state")
    out.line("if button.value and not button_state:")
    indent()
    out.line("button_state = True")
    outdent()
    out.line("if not button.value and button_state:")
    indent()
    out.line("button_state = False")
    out.line("print('button pressed')")
    out.line(`${ast.block.contents.map(make_function).join("")}`)
    outdent()
    outdent()
    out.after(line(`${name}()`))
}

function make_forever(ast, out, after) {
    let name = `task_${Math.floor(Math.random()*100000)}`
    out.line(`def ${name}():`)
    indent()
    out.line("while True:")
    indent()
    out.line(`${ast.block.contents.map(make_function).join("")}`)
    outdent()
    outdent()
    out.line(`tm.register('${name}',${name},False)`)
    out.line("")
}

function make_on_block(ast,out,after) {
    // console.log("generating for block",ast)
    if(ast.kind === 'button_clicked') return make_button_clicked(ast,out,after)
    if(ast.kind === 'forever') return make_forever(ast,out,after)
}

function generate_python(ast,out,after) {
    ast.forEach(task => make_on_block(task,out,after))
}

function generate(str,out,after) {
    let res = grammar.match(str)
    if(!res.succeeded()) return log('failed',res)
    let ast = semantics(res).toPython()
    generate_python(ast,out,after)
}

class Output {
    constructor() {
        this._before = []
        this._during = []
        this._after = []
    }
    during(str) { this._during.push(str) }
    before(str) { this._before.push(str) }
    after(str)  { this._after.push(str)  }
    line(str) { this.during(str)}

    dump() {
        console.log("output",this._before,this._during, this._after)
    }
}

async function doGenerate() {
    const output = new Output()
    generate(`
on button_clicked do {
    print("button clicked")
    mode_running = not mode_running
}
on forever do {
    if mode_running {
        print("pressing E")
    }
}
`,output)
    /*
        keyboard_press('E')
        wait(1)
        keyboard_releaseAll()
        print("waiting 60")
        wait(60)
     */
    console.log('generated',output._before.join(""))
    output.dump()
    let prelude = await fs.promises.readFile("prelude.py")
    let postlude = await fs.promises.readFile("postlude.py")
    await fs.promises.writeFile("code.py",
        prelude.toString()
        + output._before.join("")
        + output._during.join("")
        + output._after.join("")
        + postlude.toString()
    )
}

run_tests()
// doGenerate()
