import {AST_TYPES} from './grammar.js'
import {genid} from './util.js'

const INDENT = "    "
const PY_BIN_OPS = {
    '+':{symbol:'+',name:'add', fun:'add'},
    '-':{symbol:'-',name:'subtract', fun:'subtract'},
    '/':{symbol:'/',name:"divide",fun:'divide'},
    '==': {symbol: '==', name: 'equals', fun:'equals'},
    '>': {symbol: '>', name: 'greaterthan', fun:'greaterthan'},
    '>=': {symbol: '>=', name: 'greaterthanorequals',fun:'greaterthanorequals'},
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
            lines: [],
            refs:[]
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
        let n = name.indexOf('.')
        if(n >= 0) name = name.substring(0,n)
        let last = this.children[this.children.length-1]
        last.refs.push(name)
    }

    start_fun_def(name, args) {
        // console.log('starting a fun def', name)
        this.children.push({
            name: name,
            args: args,
            refs:[],
            lines: []
        })
    }

    end_fun_def(name) {
        let last = this.children.pop()
        this.lines.push(`def ${last.name}(${last.args}):`)
        let refs_set = new Set(last.refs)
        last.args.split(",").map(arg => arg.trim()).forEach(arg => {
            if(refs_set.has(arg)) refs_set.delete(arg)
        })
        let refs = [...refs_set]
        this.lines.push(...refs.map(l => INDENT + 'global ' + l))
        // this.refs = []
        this.lines.push(...last.lines)
        this.lines.push(`# end ${last.name}`)
        this.lines.push("")

    }

    generate() {
        // console.log("generating", this)
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
    out.line("#start user code")
    ast_to_py(ast.block, out)
    out.line("# end user code")
    out.outdent()
    out.end_fun_def()
    let wrapper_name = genid('wrapper_'+name)
    out.start_fun_def(wrapper_name,[])
    out.indent()
    out.line("while True:")
    out.indent()
    out.line("button.update()")
    out.line("if button.fell:")
    out.indent()
    out.line(`${name}()`)
    out.outdent()
    out.line('yield 0.01')
    out.outdent()
    out.comment("end while")
    out.outdent()
    out.end_fun_def()
    out.after(`tm.register_event('${wrapper_name}',${wrapper_name})`)

}

function setup_block(ast, out) {
    console.log("generating a setup block")
    let name = ast_to_py(ast.name, out)
    let args = ast.args.map(a => ast_to_py(a), out).join(", ")
    out.start_fun_def(name, args)
    out.indent()
    out.line("#start user code")
    ast_to_py(ast.block, out)
    out.line("# end user code")
    out.outdent()
    out.end_fun_def()
    out.after(`tm.register_start('${name}',${name})`)
}

function forever_loop(ast, out) {
    print('generating a forever loop')
    let name = ast_to_py(ast.name, out)
    let args = ast.args.map(a => ast_to_py(a), out).join(", ")
    out.start_fun_def(name, args)
    out.indent()
    out.line("#start user code")
    ast_to_py(ast.block, out)
    out.line("# end user code")
    out.outdent()
    out.end_fun_def()

    let wrapper_name = `wrapper_${name}_${Math.floor(Math.random()*10000)}`
    out.start_fun_def(wrapper_name,[])
    out.indent()
    out.line(`for y in ${name}():`)
    out.indent()
    out.line('yield y')
    out.outdent()
    out.outdent()
    out.outdent()
    out.end_fun_def()
    out.after(`tm.register_loop('${wrapper_name}',${wrapper_name})`)
}

export function ast_to_py(ast, out) {
    // console.log("doing",ast.type,'depth',out.depth)
    if (ast.type === 'identifier') return ast.name
    if (ast.type === AST_TYPES.deref) {
        let before = ast_to_py(ast.before,out)
        let after = ast_to_py(ast.after,out)
        if(ast.before.type === 'identifier') {
            out.add_variable_reference(before)
        }
        return `${before}.${after}`
    }
    if (ast.type === 'literal') {
        if (ast.kind === 'integer') return ast.value + ""
        if (ast.kind === 'float') return ast.value + ""
        if (ast.kind === 'string') return `"${ast.value}"`
        if (ast.kind === 'boolean') return (ast.value === 'false') ? "False" : "True"
    }
    if (ast.type === AST_TYPES.listliteral) {
        let elements = ast.elements.map(a => ast_to_py(a,out))
        return 'List(' + elements.join(", ") + ')'
    }
    if (ast.type === 'binexp') {
        let A = ast_to_py(ast.exp1, out)
        let B = ast_to_py(ast.exp2, out)
        if(!PY_BIN_OPS[ast.op]) throw new Error(`missing python binop ${ast.op} function`)
        let name = PY_BIN_OPS[ast.op].fun
        return `${name}(${A},${B})`
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
        let name = ast_to_py(ast.name,out)
        if(ast.expression) {
            let value = ast_to_py(ast.expression,out)
            out.line(`${name} = ${value}`)
        } else {
            out.line(`${name} = 0`)
        }
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
    if (ast.type === 'lambda') {
        let args = ast.args.map(a => ast_to_py(a,out)).flat()
        let name = genid('lambda')
        out.line(`def ${name}(${args}):`)
        out.indent()
        let body = ast_to_py(ast.body,out)
        out.outdent()
        return name
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
        if(ast.name.type === 'identifier') {
            out.add_variable_reference(name)
        }
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
        return 'return ' + ast_to_py(ast.exp,out)
    }
    if (ast.type === AST_TYPES.keywordarg) return `${ast_to_py(ast.name,out)}=${ast_to_py(ast.value,out)}`
    // console.log('converting to py',ast, JSON.stringify(ast,null,'    '))
    throw new Error(`unknown AST node ${ast.type}`)
}
