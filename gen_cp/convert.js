import fs from 'fs'
import {setupParser} from './parser.js'

const readFile = fs.promises.readFile
const writeFile = fs.promises.writeFile
function log(...args) {
    console.log(...args)
}

let parser;

function test(str) {
    log("parsing",str)
    let res = parser.grammar.match(str,)
    if(!res.succeeded()) {
        log('failed',res)
    }
    // log("succeeded")
    log(parser.semantics(res).toPython())
}

async function run_tests() {
    parser = await setupParser()
    test(`1`)
    test(`0.1`)
    test(`45`)
    test(`"foo"`)
    test(`'foo'`)
    test(`foo(5)`)
    test(`press("E")`)
    test(`keyboard_press('E')`)
    // test(`on forever do { 5 }`)
    // test('{ foo(5) } ')
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
    test(`
    #foo
    `)

    test(`
on forever do {
    keyboard_press('E')
    #wait(1)
    keyboard_releaseAll()
    wait(60)
}
on forever do {
    mouse_press('left')
    wait(5)
    mouse_releaseAll()
}
`)
    test(`
on button_clicked do {
    mode_running = not mode_running
}
    `)
    test(`
on forever do {
    if mode_running {
        print("pressing E")
    }
}
    `)
    test(`
on start do {
    mode_running = false
}
    `)
    test(`
    on start do {
        print("starting")
        #   modes := ring()
        #   modes.add(
    }
    `)
}

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
        str += "    "
    }
    return str
}
function debug(...args) {
    console.log("DEBUG",...args)
}

function make_function_call(ast,out) {
    if(ast.name === 'wait') return (`yield ${ast.args[0]}`)
    return (`${ast.name}(${ast.args.join(",")})`)
}
function make_identifier_reference(exp,out) {
    out.add_variable_reference(exp)
    return exp
}

function make_block(exp, out) {
    exp.block.contents.forEach(exp => {
        out.line(make_expression(exp,out))
    })
}

function make_conditional(exp,out) {
    out.line(`if ${make_expression(exp.expression,out)}:`)
    indent()
    make_block(exp,out)
    outdent()
}
function make_assignment(exp,out) {
    out.add_variable_reference(exp.name)
    return(exp.name + " = " + make_expression(exp.expression,out))
}
function make_expression(exp,out) {
    if(typeof exp === 'string') return make_identifier_reference(exp,out)
    if(exp.type === 'funcall') return make_function_call(exp,out)
    if(exp.type === 'assignment') return make_assignment(exp,out)
    if(exp.type === 'expression' && exp.operator === 'not') return "not " + make_expression(exp.expression,out)
    if(exp.type === 'conditional') return make_conditional(exp,out)
    if(exp.type === 'boolean') return exp.value?"True":"False"
    if(exp.type === 'comment') return "# " + exp.comment
    console.log(`UNKNOWN EXPRESSION ${JSON.stringify(exp)}`)
}

function make_on_clicked(ast, out) {
    debug("making button clicked",ast)
    let name = `event_${Math.floor(Math.random()*100000)}`
    out.start_function(name)
    out.add_variable_reference(ast.scope)
    out.line("while True:")
    indent()
    out.line("#generated")
    out.line(`${ast.scope}.update()`)
    out.line(`if ${ast.scope}.fell:`)
    indent()
    out.line("print('button pressed')")
    make_block(ast,out)
    outdent()
    out.line("yield 0.01")
    outdent()
    out.end_function(name)
    out.init(`tm.register_event('${name}',${name})`)
}
function make_on_pressed(ast, out) {
    debug("making touch pressed")
    let name = `event_${Math.floor(Math.random()*100000)}`
    out.start_function(name)
    out.line("while True:")
    indent()
    out.line("print('touch touched')")
    make_block(ast,out)
    out.line("yield 0.01")
    outdent()
    out.end_function(name)
    out.init(`tm.register_event('${name}',${name})`)
}
function make_forever(ast, out) {
    debug("making forever")
    let name = `loop_${Math.floor(Math.random()*100000)}`
    out.start_function(name)
    out.line("while True:")
    indent()
    out.line("# start user code")
    make_block(ast,out)
    out.line("# end user code")
    out.line("yield 0.01")
    outdent()
    out.end_function()
    out.init(`tm.register_loop('${name}',${name})`)
}
function make_start(ast, out) {
    debug("making start")
    let name = `start_${Math.floor(Math.random()*100000)}`
    out.start_function(name)
    make_block(ast,out)
    out.end_function(name)
    out.init(`tm.register_start('${name}',${name})`)
}


function make_mode(ast, out) {
    debug("making mode from",ast)
    let name = `mode_${ast.name}`
    out.start_function(name)
    out.line("while True:")
    indent()
    make_block(ast,out)
    outdent()
    out.line("yield 0.01")
    out.end_function(name)
    out.init(`tm.register_mode('${name}',${name})`)
}

function make_chunk(ast,out) {
    // debug("making a chunk from",ast)
    if(ast.type === 'mode') return make_mode(ast,out)
    if(ast.type === 'on') {
        if (ast.kind === 'pressed') return make_on_pressed(ast, out)
        if (ast.kind === 'clicked') return make_on_clicked(ast, out)
        if (ast.kind === 'forever') return make_forever(ast, out)
        if (ast.kind === 'start') return make_start(ast, out)
    }
    out.error(`unknown on block kind "${ast.kind}"`)
}
function generate_python(ast,out,after) {
    ast.forEach(task => make_chunk(task,out,after))
}
function generate(parser, str, out, after) {
    let res = parser.grammar.match(str)
    if(!res.succeeded()) return log('failed',res)
    let ast = parser.semantics(res).toPython()
    // console.log("ast is",ast)
    if(ast.type === 'comment') return console.log("just parsed a comment")
    generate_python(ast,out,after)
}

class Output {
    constructor() {
        this._before = []
        this._during = []
        this._after = []
        this._funs = []
        this._loop = []
    }
    during(str) { this._during.push(tab()+str) }
    before(str) { this._before.push(tab()+str) }
    init(str)  { this._after.push(tab()+str)  }
    loop(str)  { this._loop.push(tab()+str)  }
    line(str) {
        if (this.fun) {
            this.fun._during.push(tab() + str)
        } else {
            this.during(str)
        }
    }
    error(str) { this.during("ERRROR " + str)}
    start_function(str) {
        this.fun = {
            name:str,
            vars:[],
            _during:[]
        }
        indent()
    }
    end_function(str) {
        outdent()
        this._funs.push(this.fun)
        this.fun = null
    }
    add_variable_reference(name) {
        this.fun.vars.push(name)
    }

    dump() {
        console.log("output")
        console.log("before",this._before)
        console.log("during",this._during)
        console.log("after", this._after)
        console.log("loop", this._loop)
        console.log("funs",this._funs)
    }

    flatten_functions() {
        let total_vars = {}
        this._funs.forEach(fun => {
            this.line(`def ${fun.name}():`)
            indent()
            fun.vars.forEach(_var => {
                this.line(`global ${_var}`)
            })
            fun._during.forEach(dur => {
                this._during.push(dur)
            })
            outdent()
            this.during("")
            fun.vars.forEach(_var => {
                total_vars[_var] = _var
            })
        })
        Object.keys(total_vars).forEach(_var => this.before(`${_var} = 0`))
    }
}

async function doGenerate(src_file) {
    parser = await setupParser()
    const output = new Output()
    let SRC = await readFile(src_file)
    generate(parser,SRC.toString(),output)
    // console.log('generated',output._before.join(""))
    let prelude = await readFile("prelude.py")
    let postlude = await readFile("postlude.py")
    output.flatten_functions()
    // output.dump()
    await writeFile("code.py",
        prelude.toString()
        +"\n\n\n"
        + "\n#global vars\n"
        + output._before.join("\n")
        +"\n\n\n"
        +"\n# define functions\n"
        + output._during.join("\n")+ "\n"
        +"\n\n\n"
        +"\n# inits functions\n"
        + output._after.join("\n")+ "\n"
        +"\n\n\n"
        +"\n# the main loop\n"
        + postlude.toString()+ "\n"
        + output._loop.join("\n")+ "\n"
    )
    console.log("completd parsing",src_file)
    console.log("wrote code.py")
}

// run_tests()
doGenerate(process.argv[2])
