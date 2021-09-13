import ohm from 'ohm-js'
import fs from 'fs'

let grammar = ohm.grammar(`
easy {
    Exp = Cond | File | OnBlock | Block | FuncallExp | Negation | Assignment | BooleanLiteral | ident | number | string | comment
    File = OnBlock+
    Block = "{" Exp* "}"
    OnBlock = "on" OnKeyword "do" Block
    OnKeyword = "forever" | "button_clicked" | "start"
    ident  (an identifier)
        = letter (letter | digit | under)*
    number  (a number)
        = digit+ "." digit+ --float
        | digit+ --int
    under = "_"
    q = "\\'"
    qq = "\\""
    comment = "#" toEOL
    toEOL = (~"\\n" any)* "\\n" 
    
    string (text string)
        = q (~q any)* q
        | qq (~qq any)* qq
    Negation = "not" Exp
    Assignment = ident "=" Exp
    BooleanLiteral = "true" | "false"
    Cond = "if" Exp Block
    FuncallExp = ident "(" ListOf<Exp,","> ")"
}   
`)


let semantics = grammar.createSemantics()

semantics.addOperation('toPython', {
    number_int:(a) => parseInt(a.sourceString),
    number_float:(a,b,c) => parseFloat(a.sourceString+b.sourceString+c.sourceString),
    string:(a,str,c)=>`"${str.sourceString}"`,
    ident:(a,b) => a.sourceString + b.sourceString,

    FuncallExp:(name,b,args,d) => ({type:"funcall", name:name.toPython(), args:args.asIteration().children.map(arg => arg.toPython())}),
    Block:(a,contents,d) => ({type:'block',contents:contents.toPython()}),
    OnBlock:(a,kind,c,block) => ({type:'on',kind:kind.toPython(), block:block.toPython()}),
    Negation:(not,exp) => ({type:'expression', operator:'not', expression:exp.toPython() }),
    Assignment:(name,e,exp) => ({ type:'assignment', name:name.toPython(), expression:exp.toPython()}),
    BooleanLiteral:(name) => {
        if(name.sourceString === 'false') return ({type:'boolean', value:false})
        if(name.sourceString === 'true') return ({type:'boolean', value:true})
    },
    Cond:(a,exp,block) =>  ({ type:'conditional', expression:exp.toPython(), block:block.toPython()}),

    _iter:(children) => children.map(c => c.toPython()),
    _terminal:function() { return this.sourceString },
    comment:(h,comment) => ({type:'comment', comment:comment.sourceString}),
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
    test(`0.1`)
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
        str += "    "
    }
    return str
}
function make_function_call(ast,out) {
    if(ast.name === 'wait') return out.line(`yield ${ast.args[0]}`)
    out.line(`${ast.name}(${ast.args.join(",")})`)
}

function make_identifier_reference(exp,out) {
    out.add_variable_reference(exp)
    return exp
}

function make_conditional(exp,out) {
    out.line(`if ${make_expression(exp.expression,out)}:`)
    indent()
    exp.block.contents.forEach(exp => make_expression(exp,out))
    outdent()
}
function make_assignment(exp,out) {
    out.line(exp.name + " = " + make_expression(exp.expression,out))
    out.add_variable_reference(exp.name)
}

function make_expression(exp,out) {
    if(typeof exp === 'string') return make_identifier_reference(exp,out)
    if(exp.type === 'funcall') return make_function_call(exp,out)
    if(exp.type === 'assignment') return make_assignment(exp,out)
    if(exp.type === 'expression' && exp.operator === 'not') return "not " + make_expression(exp.expression,out)
    if(exp.type === 'conditional') return make_conditional(exp,out)
    if(exp.type === 'boolean') return exp.value?"True":"False"
    console.log(`UNKNOWN EXPRESSION ${JSON.stringify(exp)}`)
}


function make_button_clicked(ast, out) {
    let name = `event_${Math.floor(Math.random()*100000)}`
    out.init("button = DigitalInOut(board.SWITCH)")
    out.init("button.switch_to_input(pull=Pull.DOWN)")
    out.init("button_state = False")
    out.start_function(name)
    out.add_variable_reference('button')
    out.add_variable_reference('button_state')
    out.line("if button.value and not button_state:")
    indent()
    out.line("button_state = True")
    outdent()
    out.line("if not button.value and button_state:")
    indent()
    out.line("button_state = False")
    out.line("print('button pressed')")
    ast.block.contents.forEach(exp => make_expression(exp,out))
    outdent()
    out.end_function(name)
    indent()
    out.loop(`${name}()`)
    outdent()
}

function make_forever(ast, out) {
    let name = `loop_${Math.floor(Math.random()*100000)}`
    out.start_function(name)
    out.line("while True:")
    indent()
    ast.block.contents.forEach(exp => make_expression(exp,out))
    out.line("yield 0.01")
    outdent()
    out.end_function()
    out.init(`tm.register('${name}',${name},False)`)
}

function make_start(ast, out) {
    let name = `start_${Math.floor(Math.random()*100000)}`
    out.start_function(name)
    ast.block.contents.forEach(exp => make_expression(exp,out))
    out.end_function(name)
    out.init(`${name}()`)
}

function make_on_block(ast,out) {
    if(ast.kind === 'button_clicked') return make_button_clicked(ast,out)
    if(ast.kind === 'forever') return make_forever(ast,out)
    if(ast.kind === 'start') return make_start(ast,out)
    out.error(`unknown on block kind "${ast.kind}"`)
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

const SRC = `
on start do {
    mode_running = false
}
on button_clicked do {
    mode_running = not mode_running
    print("mode running",mode_running)
}
on forever do {
    if mode_running {
        print("pressing E")
        keyboard_press('E')
        set_led(RED)
        
        wait(0.3)
        set_led(BLACK)
        wait(0.3)
        set_led(RED)
        wait(0.3)
        set_led(BLACK)
        wait(0.3)
        
        keyboard_releaseAll()
        print("waiting")
        wait(60)
    }
}
`
async function doGenerate() {
    const output = new Output()
    generate(SRC,output)
    // console.log('generated',output._before.join(""))
    let prelude = await fs.promises.readFile("prelude.py")
    let postlude = await fs.promises.readFile("postlude.py")
    output.flatten_functions()
    // output.dump()
    await fs.promises.writeFile("code.py",
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
}

// run_tests()
doGenerate()
