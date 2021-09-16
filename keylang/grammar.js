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
        number_int: (a) => ({type:'literal', kind:'integer', value:parseInt(toStr(a))}),
        number_float: (a, b, c) => ({type:'literal', kind:'float', value:parseFloat(toStr(a,b,c))}),
        string: (a, str, c) => ({type:'literal', kind:'string', value:toStr(str)}),
        ident: (start, rest,suffix) => ({type:"identifier", name:toStr(start,rest,suffix)}),
        Assignment: (name, e, exp) => ({
            type: 'assignment',
            name: name.ast(),
            expression: exp.ast(),
        }),
        FunctionCall: (name, p1, args, p2) => ({
            type: "funcall",
            name: name.ast(),
            args: args.asIteration().children.map(arg => arg.ast())
        }),
        Lambda:(c1, args, c2, arrow, body) => {
            return {
                type:'lambda',
                args:args.asIteration().children.map(arg => arg.ast()),
                body:body.ast(),
            }
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

export function ast_to_js(ast) {
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
    console.log('converting to js',ast)
    throw new Error(`unknown AST node ${ast.type}`)
}
