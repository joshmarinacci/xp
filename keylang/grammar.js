import fs from 'fs'
import ohm from 'ohm-js'
import {MDList} from './libs_js/common.js'

export const AST_TYPES = {
    vardec:'vardec',
    unexp: "unexp",
    conditional: "condition",
    listliteral: 'listliteral',
    funcall: 'funcall',
    keywordarg: 'keywordarg',
    deref: 'deref',
    binexp: 'binexp'
}
export const FUN_CALL_TYPES = {
    positional: 'positional',
    keyword: "keyword"
}

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
        valid_ident: (start, rest,suffix) => ({type:"identifier", name:toStr(start,rest,suffix)}),
        comment:(space,symbol,content) => ({type:'comment',content:content.sourceString}),
        boolean:(s) => ({type:'literal', kind:'boolean', value:toStr(s)}),
        ListLiteral:(_1, elements, _2) => {
            return {
                type: AST_TYPES.listliteral,
                elements: elements.asIteration().children.map(arg => arg.ast())
            }
        },
        Assignment: (name, e, exp) => ({
            type: 'assignment',
            name: name.ast(),
            expression: exp.ast(),
        }),
        VarDec_dec:(_var, name) => ({
            type:AST_TYPES.vardec,
            name:name.ast(),
            expression:null,
        }),
        VarDec_assign:(_var, name, eq, exp) => ({
            type:AST_TYPES.vardec,
            name:name.ast(),
            expression: exp.ast(),
        }),
        PositionalFunCall: (name, p1, args, p2) => ({
            type: AST_TYPES.funcall,
            name: name.ast(),
            form:FUN_CALL_TYPES.positional,
            args: args.asIteration().children.map(arg => arg.ast())
        }),
        KeywordFunCall:(name, p1, args, p2) => ({
            type: AST_TYPES.funcall,
            name: name.ast(),
            form:FUN_CALL_TYPES.keyword,
            args: args.asIteration().children.map(arg => arg.ast())
        }),
        KeywordArg:(name, _1, value) => ({
            type: AST_TYPES.keywordarg,
            name: name.ast(),
            value:value.ast(),
        }),
        CondExp_full:(_1,cond,then_block,_2,else_block) => {
            // console.log('iff',cond.ast(),then_block.ast(),else_block.ast())
            let eb = else_block.ast()
            return ({
                type:AST_TYPES.conditional,
                condition:cond.ast(),
                then_block:then_block.ast(),
                has_else:eb.length > 0,
                else_block:(eb.length > 0)?eb[0]:null,
            })
        },
        CondExp_slim:(_1,cond,then) => {
            return ({
                type:AST_TYPES.conditional,
                condition:cond.ast(),
                then_block:then.ast(),
                has_else:false,
                else_block:null,
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
        UnExp: (op, exp) => ({
            type:AST_TYPES.unexp,
            op:op.sourceString,
            exp:exp.ast(),
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
        },
        Directive:(at,name, p1, args, p2) => {
            return {
                type:'directive',
                name:name.ast(),
                args:args.asIteration().children.map(arg => arg.ast()),
            }
        }

    })

    return [grammar,semantics]
}
export function eval_ast(ast,scope) {
    // console.log('ast',JSON.stringify(ast,null,'   '))
    if(ast.type === 'literal') {
        if(ast.kind === 'boolean') {
            if(ast.value === 'true') return true
            if(ast.value === 'false') return false
        }
        return ast.value
    }
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
    if(ast.type === 'binexp') {
        let A = eval_ast(ast.exp1)
        let B = eval_ast(ast.exp2)
        if(ast.op === '+') return A+B
        if(ast.op === 'and') return A&&B
        if(ast.op === 'or') return A||B
    }
    if(ast.type === 'unexp') {
        let A = eval_ast(ast.exp)
        if(ast.op === 'not') return !A
    }
    if(ast.type === 'body') {
        console.log("body is",ast.body)
        return ast.body.map(exp => {
            console.log("body expression",exp)
            return eval_ast(exp,scope)
        })
    }
    if(ast.type === AST_TYPES.listliteral) {
        let f_args = ast.elements.map(arg => eval_ast(arg,scope))
        return new MDList(...f_args)
    }
    if(ast.type === AST_TYPES.conditional) {
        if(eval_ast(ast.condition)) {
            return eval_ast(ast.then_block)
        } else {
            return eval_ast(ast.else_block)[0]
        }
    }
    if(ast.type === 'lambda') {
        console.log('ast',JSON.stringify(ast,null,'   '))
        console.log("args",ast.args)
        let f_args = ast.args.map(arg => eval_ast(arg,scope))
        console.log("fargs",f_args)
        console.log("body", eval_ast(ast.body,scope))
        // console.log("lambda ",ast)
    }
    throw new Error("eval ast not implemented for " + JSON.stringify(ast,null,'  '))
}


