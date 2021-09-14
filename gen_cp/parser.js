import fs from 'fs'
import ohm from 'ohm-js'
const readFile = fs.promises.readFile
const toStr = (...nodes) => {
    return nodes.map(o => o.sourceString).join("")
}

export async function setupParser() {
    let grammar_source = await readFile("grammar.ohm")
    let grammar = ohm.grammar(grammar_source.toString())
    let semantics = grammar.createSemantics()

    semantics.addOperation('toPython', {
        number_int: (a) => parseInt(toStr(a)),
        number_float: (a, b, c) => parseFloat(toStr(a,b,c)),
        string: (a, str, c) => `"${toStr(str)}"`,
        ident: (start, rest,suffix) => toStr(start,rest,suffix),
        FuncallExp: (name, b, args, d) => ({
            type: "funcall",
            name: name.toPython(),
            args: args.asIteration().children.map(arg => arg.toPython())
        }),
        Block: (a, contents, d) => ({type: 'block', contents: contents.toPython()}),
        OnBlock: (a, scope, kind, c, block,_1) => ({
            type: 'on',
            scope:scope.toPython(),
            kind: kind.toPython(),
            block: block.toPython()
        }),
        ModeBlock:(_,name,d,block) => ({
            type:'mode',
            name:name.toPython(),
            block: block.toPython(),
        }),
        Negation: (not, exp) => ({type: 'expression', operator: 'not', expression: exp.toPython()}),
        Assignment: (name, e, exp) => ({
            type: 'assignment',
            name: name.toPython(),
            expression: exp.toPython()
        }),
        BooleanLiteral: (name) => {
            if (name.sourceString === 'false') return ({type: 'boolean', value: false})
            if (name.sourceString === 'true') return ({type: 'boolean', value: true})
        },
        List:(open,content,close) => {
            // console.log("list",toStr(open),toStr(close), content)
            return {type:'list', values:content.asIteration().children.map(arg => arg.toPython())}
        },
        Cond: (a, exp, block) => ({
            type: 'conditional',
            expression: exp.toPython(),
            block: block.toPython()
        }),
        File:(_c1, blocks, _c2) => {
            return blocks.toPython()
        },

        _iter: (children) => children.map(c => c.toPython()),
        _terminal: function () {
            return this.sourceString
        },
        comment: (pre, h, comment) => ({type: 'comment', comment: comment.sourceString}),
    })
    return {
        grammar:grammar,
        semantics:semantics
    }
}
