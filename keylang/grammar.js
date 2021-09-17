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
