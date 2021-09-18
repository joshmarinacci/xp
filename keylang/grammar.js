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


export function ast_to_py(ast,first) {
    if(ast.type === 'identifier') return ast.name
    if(ast.type === 'literal') {
        if(ast.kind === 'integer') return ast.value+""
        if(ast.kind === 'float') return ast.value+""
        if(ast.kind === 'string') return `"${ast.value}"`
        if(ast.kind === 'boolean') return (ast.value === 'false')?"False":"True"
    }
    if(ast.type === 'binexp') {
        let A = ast_to_py(ast.exp1)
        let B = ast_to_py(ast.exp2)
        // console.log('binary expression',ast,A,B)
        return `${A} ${PY_BIN_OPS[ast.op].symbol} ${B}`
        // return []
    }
    if(ast.type === 'comment') {
        return [`#${ast.content.trim()}`]
    }
    if(ast.type === 'assignment') {
        return [`${ast_to_py(ast.name)} = ${ast_to_py(ast.expression)}`]
    }
    if(ast.type === 'body') {
        let lines = ast.body.map(chunk => ast_to_py(chunk))
        if(first) return lines.flat()
        // console.log("body lines",indent_array(lines.flat()))
        return indent_array(lines.flat())
    }
    if(ast.type === 'fundef') {
        console.log("doing fun def",JSON.stringify(ast,null,'   '))
        let name = ast_to_py(ast.name)
        let lines = []
        lines.push(`def ${ast_to_py(ast.name)}(${ast.args.map(a => ast_to_py(a)).join(", ")}):`)
        let block_lines = ast_to_py(ast.block)
        let did_special = false
        if(name === 'setup') {
            console.log("adding global var refs")
            did_special = true
            console.log("need to add some extra stuff for a setup")
            let l2 = [
                "global my_button",
                "global mode_running",
                "#start user code"
            ]
            lines.push(...indent_array(l2))
            lines.push(...block_lines)
        }
        if(name === 'loop') {
            console.log("adding global var refs")
            did_special = true
            console.log("need to add some extra stuff for a loop")
            lines.push(indent_line("while True:"))
            lines.push(indent_line("#start user code"))
            lines.push(...indent_array(block_lines))
            lines.push(indent_line("# end user code"))
            lines.push(indent_line(indent_line("yield 0.01")))
            lines.push()
        }
        if(name === 'my_button_clicked') {
            console.log("need to add some extra stuff for button clicked")
            console.log("adding global var refs")
            let l2 = [
                "global my_button",
                "global mode_running",
                "while True:",
                "#start user code"
            ]
            l2.push(...indent_array([
                "my_button.update()",
                "if my_button.fell:"
            ]))
            lines.push(...indent_array(l2))
            // lines.push(indent_line(indent_line("my_button.update()")))
            // lines.push(indent_line(indent_line("if my_button.fell:")))
            lines.push(...indent_array(indent_array(block_lines)))
            lines.push(...indent_array(indent_array([
                "# end user code",
                "yield 0.01"
            ])))
            did_special = true
        }
        if(!did_special) {
            lines = lines.concat(block_lines)
        }
        lines.push("")
        console.log("fundef lines",lines)
        return lines
    }
    if(ast.type === 'funcall') {
        // console.log("doing funcall",ast)
        let name = ast_to_py(ast.name)
        let args = ast.args.map(a => ast_to_py(a)).join(", ")
        if(name === 'wait') {
            return [`yield ${args}`]
        }
        return [`${name}(${args})`]
    }
    if(ast.type === 'condition') {
        let lines = []
        lines.push(`if ${ast_to_py(ast.condition)}:`)
        let then_block = ast_to_py(ast.then_block)
        lines = lines.concat(then_block)
        if(ast.has_else) {
            lines.push('else:')
            lines = lines.concat(ast_to_py(ast.else_block))
        }
        console.log('cond',lines)
        return lines
    }
    console.log('converting to py',ast, JSON.stringify(ast,null,'    '))
    throw new Error(`unknown AST node ${ast.type}`)
}
