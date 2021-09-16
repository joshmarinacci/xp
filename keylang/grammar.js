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
        number_int: (a) => ({type:'literal', value:parseInt(toStr(a))}),
        number_float: (a, b, c) => ({type:'literal', value:parseFloat(toStr(a,b,c))}),
        string: (a, str, c) => ({type:'literal', value:toStr(str)}),
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

    })

    return [grammar,semantics]
}
