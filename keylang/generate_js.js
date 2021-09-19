const BIN_OPS = {
    '+': {
        name: 'add'
    },
    '-': {
        name: 'subtract'
    },
    '*': {
        name: 'multiply'
    },
    '/': {
        name: 'divide'
    },
    '<': {
        name: 'lessthan'
    },
    '==': {
        name: 'equal'
    }
}

export function ast_to_js(ast) {
    if (ast.type === 'comment') {
        return ""
    }
    if (ast.type === 'literal') {
        if (ast.kind === 'integer') return "" + ast.value
        if (ast.kind === 'boolean') return "" + ast.value
        if (ast.kind === 'float') return "" + ast.value
        if (ast.kind === 'string') return `"${ast.value}"`
    }
    if (ast.type === 'identifier') return "" + ast.name
    if (ast.type === 'funcall') {
        let args = ast.args.map(a => ast_to_js(a))
        let name = ast_to_js(ast.name)
        if(name === 'wait') {
            return `await sleep(${args.join(",")})`
        }
        return `${ast_to_js(ast.name)}(${args.join(",")})`
    }
    if (ast.type === 'assignment') {
        let name = ast_to_js(ast.name)
        let value = ast_to_js(ast.expression)
        if (ast.letp.length === 1) {
            return [`let ${name} = ${value}`]
        } else {
            return [`${name} = ${value}`]
        }
    }
    const INDENT = "    "
    if (ast.type === 'fundef') {
        let args = ast.args.map(a => ast_to_js(a))
        return [
            `async function ${ast_to_js(ast.name)}(${args}){`,
            ...ast_to_js(ast.block).map(s => INDENT + s),
            `}`
        ]
    }
    if (ast.type === 'body') {
        return ast.body.map(b => ast_to_js(b)).flat()
    }
    if (ast.type === 'lambda') {
        let args = ast.args.map(a => ast_to_js(a)).flat()
        let body = ast_to_js(ast.body)
        let last = ""
        if (body.length > 1) {
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
    if (ast.type === 'deref') {
        let before = ast_to_js(ast.before)
        let after = ast_to_js(ast.after)
        return `${before}.${after}`
    }
    if (ast.type === 'binexp') {
        let op = BIN_OPS[ast.op]
        if (op) return `${op.name}(${ast_to_js(ast.exp1)},${ast_to_js(ast.exp2)})`
    }
    if (ast.type === 'condition') {
        return `if(${ast_to_js(ast.condition)}) {\n`
            + ast_to_js(ast.then_block).join("\n")
            + "}"
            + (ast.has_else ? ' else{ ' + ast_to_js(ast.else_block) + "}" : "")
    }
    if (ast.type === 'return') return `return ${ast_to_js(ast.exp)}`
    console.log('converting to js', ast)
    throw new Error(`unknown AST node ${ast.type}`)
}
