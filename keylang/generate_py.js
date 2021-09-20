import {AST_TYPES} from './grammar.js'

const INDENT = "    "
const PY_BIN_OPS = {
    '==': {symbol: '==', name: 'equals'},
    "or": {symbol: 'or', name:' or'},
    "and": {symbol: 'and', name:' and'},
}
const PY_UN_OPS = {
    'not': {symbol: 'not', name:'not'}
}

export class PyOutput {
    constructor(depth) {
        this.depth = depth || 0
        this.refs = []
        this.lines = []
        this.children = [{
            name: "top",
            args: [],
            lines: []
        }]
        this.afters = []
    }

    line(str) {
        let last = this.children[this.children.length - 1]
        for (let i = 0; i < this.depth; i++) str = INDENT + str
        last.lines.push(str)
    }

    comment(str) {
        return this.line('#' + str)
    }

    indent() {
        this.depth += 1
    }

    outdent() {
        this.depth -= 1
    }

    after(str) {
        this.afters.push(str)
    }

    add_variable_reference(name) {
        this.refs.push(name)
    }

    start_fun_def(name, args) {
        console.log('starting a fun def', name)
        this.children.push({
            name: name,
            args: args,
            lines: []
        })
    }

    end_fun_def(name) {
        let last = this.children.pop()
        this.lines.push(`def ${last.name}(${last.args}):`)
        this.lines.push(...this.refs.map(l => INDENT + 'global ' + l))
        // this.refs = []
        this.lines.push(...last.lines)
        this.lines.push(`# end ${last.name}`)
        this.lines.push("")

    }

    generate() {
        console.log("generating", this)
        let last = this.children.pop()
        this.lines.unshift(...last.lines)
        return this.lines.join("\n") + "\n" + "\n" + this.afters.join("\n")
    }
}

function button_click(ast, out) {
    let name = ast_to_py(ast.name, out)
    let args = ast.args.map(a => ast_to_py(a), out).join(", ")
    out.start_fun_def(name, args)
    out.indent()
    out.line("while True:")
    out.indent()
    out.line("button.update()")
    out.line("if button.fell:")
    out.indent()
    out.line("#start user code")
    ast_to_py(ast.block, out)
    out.line("# end user code")
    out.outdent()
    out.line('yield 0.01')
    out.outdent()
    out.comment("end while")
    out.outdent()
    out.end_fun_def()
    out.after(`tm.register_event('${name}',${name})`)
}

function setup_block(ast, out) {
    let name = ast_to_py(ast.name, out)
    let args = ast.args.map(a => ast_to_py(a), out).join(", ")
    out.start_fun_def(name, args)
    out.indent()
    out.line("#start user code")
    ast_to_py(ast.block, out)
    console.log("now out is", out.children)
    out.line("# end user code")
    out.outdent()
    out.end_fun_def()
    out.after(`tm.register_start('${name}',${name})`)
}

function forever_loop(ast, out) {
    let name = ast_to_py(ast.name, out)
    let args = ast.args.map(a => ast_to_py(a), out).join(", ")
    out.start_fun_def(name, args)
    out.indent()
    out.line("while True:")
    out.indent()
    out.line("#start user code")
    ast_to_py(ast.block, out)
    out.line("# end user code")
    out.line('yield 0.01')
    out.outdent()
    out.outdent()
    out.end_fun_def()
    out.after(`tm.register_loop('${name}',${name})`)
}

export function ast_to_py(ast, out) {
    // console.log("doing",ast.type,'depth',out.depth)
    if (ast.type === 'identifier') return ast.name
    if (ast.type === 'literal') {
        if (ast.kind === 'integer') return ast.value + ""
        if (ast.kind === 'float') return ast.value + ""
        if (ast.kind === 'string') return `"${ast.value}"`
        if (ast.kind === 'boolean') return (ast.value === 'false') ? "False" : "True"
    }
    if (ast.type === 'binexp') {
        let A = ast_to_py(ast.exp1, out)
        let B = ast_to_py(ast.exp2, out)
        return `${A} ${PY_BIN_OPS[ast.op].symbol} ${B}`
    }
    if (ast.type === AST_TYPES.unexp) {
        let A = ast_to_py(ast.exp, out)
        return `${PY_UN_OPS[ast.op].symbol} ${A}`
    }
    if (ast.type === 'comment') {
        out.line(`#${ast.content.trim()}`)
        return
    }
    if (ast.type === AST_TYPES.vardec) {
        out.line(`${ast_to_py(ast.name)} = 0`)
        return
    }
    if (ast.type === 'assignment') {
        let name = ast_to_py(ast.name, out)
        out.add_variable_reference(name)
        out.line(`${name} = ${ast_to_py(ast.expression, out)}`)
        return
    }
    if (ast.type === 'body') {
        ast.body.map(chunk => {
            let res = ast_to_py(chunk, out)
            if (res) out.line(res)
        })
        return
    }
    if (ast.type === 'fundef') {
        let name = ast_to_py(ast.name, out)
        if (name === 'my_button_clicked') return button_click(ast, out)
        if (name === 'loop') return forever_loop(ast, out)
        if (name === 'setup') return setup_block(ast, out)
        let args = ast.args.map(a => ast_to_py(a), out).join(", ")
        out.start_fun_def(name, args)
        out.indent()
        ast_to_py(ast.block, out)
        out.outdent()
        out.end_fun_def(name)
        return
    }
    if (ast.type === 'funcall') {
        let name = ast_to_py(ast.name, out)
        let args = ast.args.map(a => ast_to_py(a, out)).join(", ")
        if (name === 'wait') {
            return (`yield ${args}`)
        }
        return (`${name}(${args})`)
    }
    if (ast.type === AST_TYPES.conditional) {
        let lines = []
        out.line(`if ${ast_to_py(ast.condition, out)}:`)
        out.indent()
        let ret = ast_to_py(ast.then_block, out)
        if(ret) out.line(ret)
        out.outdent()
        if (ast.has_else) {
            out.line('else:')
            out.indent()
            ast_to_py(ast.else_block, out)
            out.outdent()
        }
        return
    }
    if (ast.type === 'return') {
        return 'return'
    }
    // console.log('converting to py',ast, JSON.stringify(ast,null,'    '))
    throw new Error(`unknown AST node ${ast.type}`)
}
