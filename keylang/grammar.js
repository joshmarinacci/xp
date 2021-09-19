import fs from 'fs'
import ohm from 'ohm-js'

const readFile = fs.promises.readFile

export async function make_grammar() {
    let grammar_source = await readFile("./grammar.ohm")
    return ohm.grammar(grammar_source.toString())
}
export async function make_grammar_semantics() {
    const toStr = (...nodes) => nodes.map(o => o.sourceString).join("")
    let grammar = await make_grammar()
    let semantics = grammar.createSemantics()
    semantics.addOperation('ast', {
        _terminal: function () { return this.sourceString },
        number_int: (n,a) => ({type:'literal', kind:'integer', value:parseInt(toStr(n,a))}),
        number_float: (n,a, b, c) => ({type:'literal', kind:'float', value:parseFloat(toStr(n,a,b,c))}),
        string: (a, str, c) => ({type:'literal', kind:'string', value:toStr(str)}),
        ident: (start, rest,suffix) => ({type:"identifier", name:toStr(start,rest,suffix)}),
        comment:(space,symbol,content) => ({type:'comment',content:content.sourceString}),
        boolean:(s) => ({type:'literal', kind:'boolean', value:toStr(s)}),
        Assignment: (letp, name, e, exp) => ({
            type: 'assignment',
            letp:letp.ast(),
            name: name.ast(),
            expression: exp.ast(),
        }),
        FunctionCall: (name, p1, args, p2) => ({
            type: "funcall",
            name: name.ast(),
            args: args.asIteration().children.map(arg => arg.ast())
        }),
        CondExp:(_1,cond,then_block,_2,else_block) => {
            // console.log('iff',cond.ast(),then_block.ast(),else_block.ast())
            let eb = else_block.ast()
            return ({
                type:'condition',
                condition:cond.ast(),
                then_block:then_block.ast(),
                has_else:eb.length > 0,
                else_block:(eb.length > 0)?eb[0]:null,
            })
        },
        Return:(ret,exp)=> ({
            type:"return",
            exp: exp.ast()
        }),
        BinExp: (exp1, op, exp2) => ({
            type:"binexp",
            op:op.sourceString,
            exp1:exp1.ast(),
            exp2:exp2.ast(),
        }),
        ParenExp: (p1, exp, p2) => exp.ast(),
        FunctionDef:(fun,name,p1,args,p2,block) => ({
            type:"fundef",
            name:name.ast(),
            args: args.asIteration().children.map(arg => arg.ast()),
            block:block.ast(),
        }),
        Deref:(before,dot,after) => {
            return {
                type:'deref',
                before:before.ast(),
                after:after.ast()
            }
        },
        Lambda:(c1, args, c2, arrow, body) => {
            return {
                type:'lambda',
                args:args.asIteration().children.map(arg => arg.ast()),
                body:body.ast(),
            }
        },
        EmptyListOf:() => {
            return []
        },
        Block:(b1, body, b2) => {
            return {
                type:'body',
                body:body.ast(),
            }
        }

    })

    return [grammar,semantics]
}
export function eval_ast(ast,scope) {
    // console.log('ast',JSON.stringify(ast,null,'   '))
    if(ast.type === 'literal') return ast.value
    if(ast.type === 'identifier') return ast.name
    if(ast.type === 'funcall') {
        // console.log('ast for the fun call is',ast)
        let name = eval_ast(ast.name,scope)
        // console.log("fun name is",name, typeof name)
        let fun = null
        if(typeof name === 'string') {
            fun = scope[name]
        }
        if(typeof name === 'function') {
            fun = name
        }
        if(!fun) throw new Error(`no function in scope named ${name}`)
        // console.log('got the fun',fun)
        // console.log(`args for ${name}() are`, ast.args)
        let f_args = ast.args.map(arg => eval_ast(arg,scope))
        // console.log(`evaluated args for ${name} are`,f_args)
        let ret = fun(...f_args)
        // console.log(`return of ${name} is`,ret)
        return ret
    }
    if(ast.type === 'assignment') {
        let name = eval_ast(ast.name,scope)
        scope[name] = eval_ast(ast.expression,scope)
        return scope[name]
    }
    if(ast.type === 'body') {
        console.log("body is",ast.body)
        return ast.body.map(exp => {
            console.log("body expression",exp)
            return eval_ast(exp,scope)
        })
    }
    if(ast.type === 'lambda') {
        console.log('ast',JSON.stringify(ast,null,'   '))
        console.log("args",ast.args)
        let f_args = ast.args.map(arg => eval_ast(arg,scope))
        console.log("fargs",f_args)
        console.log("body", eval_ast(ast.body,scope))
        // console.log("lambda ",ast)
    }
    throw new Error("eval ast not implemented")
}

const BIN_OPS = {
    '+':{
        name:'add',
    },
    '-':{
        name:'subtract',
    },
    '*':{
        name:'multiply',
    },
    '/':{
        name:'divide',
    },
    '<':{
        name:'lessthan'
    }
}

export function ast_to_js(ast) {
    if(ast.type === 'comment') {
        return ""
    }
    if(ast.type === 'literal') {
        if(ast.kind === 'integer') return ""+ast.value
        if(ast.kind === 'float') return ""+ast.value
        if(ast.kind === 'string') return `"${ast.value}"`
    }
    if(ast.type === 'identifier') return ""+ast.name
    if(ast.type === 'funcall') {
        let args = ast.args.map(a => ast_to_js(a))
        return `${ast_to_js(ast.name)}(${args.join(",")})`
    }
    if(ast.type === 'assignment') {
        // console.log("assignment",ast)
        let name = ast_to_js(ast.name)
        let value = ast_to_js(ast.expression)
        if(ast.letp.length === 1) {
            return [`let ${name} = ${value}`]
        }  else {
            return [`${name} = ${value}`]
        }
    }
    const INDENT = "    "
    if(ast.type === 'fundef') {
        let args = ast.args.map(a => ast_to_js(a))
        return [
            `function ${ast_to_js(ast.name)}(${args}){`,
            ...ast_to_js(ast.block).map(s => INDENT + s),
            `}`
        ]
    }
    if(ast.type === 'body') {
        return ast.body.map(b => ast_to_js(b)).flat()
    }
    if(ast.type === 'lambda') {
        let args = ast.args.map(a => ast_to_js(a)).flat()
        let body = ast_to_js(ast.body)
        let last = ""
        if(body.length > 1) {
            last = body.pop()
        } else {
            last = body
            body = []
        }
        return `(${args.join(",")}) => {
            ${body} 
        return ${last} 
        }`
    }
    if(ast.type === 'deref') {
        let before = ast_to_js(ast.before)
        let after = ast_to_js(ast.after)
        return `${before}.${after}`
    }
    if(ast.type === 'binexp') {
        let op = BIN_OPS[ast.op]
        if(op) return `${op.name}(${ast_to_js(ast.exp1)},${ast_to_js(ast.exp2)})`
    }
    if(ast.type === 'return')  return `return ${ast_to_js(ast.exp)}`
    console.log('converting to js',ast)
    throw new Error(`unknown AST node ${ast.type}`)
}

const INDENT = "    "
function indent_array(arr) {
    return arr.map(s => INDENT+s)
}
function indent_line(line) {
    return INDENT+line
}

const PY_BIN_OPS = {
    '==': {symbol:'==', name:'equals'}
}


export class PyOutput {
    constructor(depth) {
        this.depth = depth || 0
        this.refs = []
        this.lines = []
        this.children = [{
            name:"top",
            args:[],
            lines:[]
        }]
        this.afters = []
    }
    line(str) {
        let last = this.children[this.children.length-1]
        for(let i=0; i<this.depth; i++) str = INDENT + str
        last.lines.push(str)
    }
    comment(str) {
        return this.line('#'+str)
    }
    indent() {
        this.depth+=1
    }
    outdent() {
        this.depth-=1
    }
    after(str) {
        this.afters.push(str)
    }
    add_variable_reference(name) {
        this.refs.push(name)
    }
    start_fun_def(name, args) {
        console.log('starting a fun def',name)
        this.children.push({
            name:name,
            args:args,
            lines:[]
        })
    }
    end_fun_def(name) {
        let last = this.children.pop()
        this.lines.push(`def ${last.name}(${last.args}):`)
        this.lines.push(...this.refs.map(l => INDENT+'global '+l))
        // this.refs = []
        this.lines.push(...last.lines)
        this.lines.push(`# end ${last.name}`)
        this.lines.push("")

    }

    generate() {
        console.log("generating",this)
        let last = this.children.pop()
        this.lines.unshift(...last.lines)
        return this.lines.join("\n") + "\n" + "\n" + this.afters.join("\n")
    }
}


function button_click(ast, out) {
    let name = ast_to_py(ast.name,out)
    let args = ast.args.map(a => ast_to_py(a),out).join(", ")
    out.start_fun_def(name,args)
    out.indent()
    out.line("while True:")
    out.indent()
    out.line("my_button.update()")
    out.line("if my_button.fell:")
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
function setup_block(ast,out) {
    let name = ast_to_py(ast.name,out)
    let args = ast.args.map(a => ast_to_py(a),out).join(", ")
    out.start_fun_def(name,args)
    out.indent()
    out.line("#start user code")
    ast_to_py(ast.block, out)
    console.log("now out is",out.children)
    out.line("# end user code")
    out.outdent()
    out.end_fun_def()
    out.after(`tm.register_start('${name}',${name})`)
}
function forever_loop(ast,out) {
    let name = ast_to_py(ast.name,out)
    let args = ast.args.map(a => ast_to_py(a),out).join(", ")
    out.start_fun_def(name,args)
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

export function ast_to_py(ast,out) {
    // console.log("doing",ast.type,'depth',out.depth)
    if(ast.type === 'identifier') return ast.name
    if(ast.type === 'literal') {
        if(ast.kind === 'integer') return ast.value+""
        if(ast.kind === 'float')   return ast.value+""
        if(ast.kind === 'string')  return`"${ast.value}"`
        if(ast.kind === 'boolean') return (ast.value === 'false')?"False":"True"
    }
    if(ast.type === 'binexp') {
        let A = ast_to_py(ast.exp1,out)
        let B = ast_to_py(ast.exp2,out)
        return `${A} ${PY_BIN_OPS[ast.op].symbol} ${B}`
    }
    if(ast.type === 'comment') {
        out.line(`#${ast.content.trim()}`)
        return
    }
    if(ast.type === 'assignment') {
        let name =ast_to_py(ast.name,out)
        out.add_variable_reference(name)
        out.line(`${name} = ${ast_to_py(ast.expression,out)}`)
        return
    }
    if(ast.type === 'body') {
        // console.log('doing a body',out.depth,ast)
        ast.body.map(chunk => {
            let res = ast_to_py(chunk,out)
            if(res)  out.line(res)
        })
        // if(out.depth === 0) return lines.flat()
        // console.log("body lines",indent_array(lines.flat()))
        // return indent_array(lines.flat())
        return
    }
    if(ast.type === 'fundef') {
        // console.log("doing fun def",JSON.stringify(ast,null,'   '))
        let name = ast_to_py(ast.name,out)
        if(name === 'my_button_clicked') return button_click(ast,out)
        if(name === 'loop') return forever_loop(ast, out)
        if(name === 'setup') return setup_block(ast,out)
        let args = ast.args.map(a => ast_to_py(a),out).join(", ")
        out.start_fun_def(name,args)
        out.indent()
        ast_to_py(ast.block, out)
        out.outdent()
        out.end_fun_def(name)
        return
    }
    if(ast.type === 'funcall') {
        let name = ast_to_py(ast.name,out)
        let args = ast.args.map(a => ast_to_py(a,out)).join(", ")
        if(name === 'wait') {
            return (`yield ${args}`)
        }
        return (`${name}(${args})`)
    }
    if(ast.type === 'condition') {
        let lines = []
        out.line(`if ${ast_to_py(ast.condition,out)}:`)
        out.indent()
        ast_to_py(ast.then_block,out)
        out.outdent()
        if(ast.has_else) {
            out.line('else:')
            out.indent()
            ast_to_py(ast.else_block,out)
            out.outdent()
        }
        return
    }
    // console.log('converting to py',ast, JSON.stringify(ast,null,'    '))
    throw new Error(`unknown AST node ${ast.type}`)
}
