import {AST_TYPES, FUN_CALL_TYPES} from './grammar.js'

const UN_OPS = {
    'not':{
        name:'not'
    }
}
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
    '>': {
        name:'greaterthan'
    },
    '==': {
        name: 'equal'
    },
    'or':{
        name: 'or'
    }
}

function lambdawrap(then_clause, ast) {
    if(ast && ast.type === 'body') {
        if(ast.body.length > 0) {
            if(ast.body[0].type === 'return') {
                return `()=>{${then_clause}}`
            }
        }
    }
    return `()=>{return ${then_clause}}`
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
    if (ast.type === AST_TYPES.listliteral) {
        let elements = ast.elements.map(a => ast_to_js(a))
        return 'List(' + elements.join(", ") + ')'
    }
    if (ast.type === 'funcall') {
        let args = ast.args.map(a => ast_to_js(a))
        let name = ast_to_js(ast.name)
        if(name === 'wait') {
            return `sleep(${args.join(",")})`
        }
        if(ast.form === FUN_CALL_TYPES.keyword) {
            return `${name}({${args.join(',')}})`
        } else {
            return `${name}(${args.join(",")})`
        }
    }
    if (ast.type === 'assignment') {
        let name = ast_to_js(ast.name)
        let value = ast_to_js(ast.expression)
        return [`${name} = ${value}`]
    }
    if (ast.type === AST_TYPES.vardec) {
        let name = ast_to_js(ast.name)
        if(ast.expression) {
            let value = ast_to_js(ast.expression)
            return ['let ' + name + ' = '+ value]
        }
        return ['let ' + name]
    }
    const INDENT = "    "
    const ind = (arr) => arr.map(s => INDENT+s)
    if (ast.type === 'fundef') {
        let args = ast.args.map(a => ast_to_js(a))
        return [
            `function ${ast_to_js(ast.name)}(${args}){`,
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
            ${ind(body).join("\n")} 
        return ${last} 
        }`
    }
    if (ast.type === AST_TYPES.deref) {
        let before = ast_to_js(ast.before)
        let after = ast_to_js(ast.after)
        return `${before}.${after}`
    }
    if (ast.type === 'binexp') {
        let op = BIN_OPS[ast.op]
        if (op) return `${op.name}(${ast_to_js(ast.exp1)},${ast_to_js(ast.exp2)})`
    }
    if (ast.type === AST_TYPES.unexp) {
        let op = UN_OPS[ast.op]
        if (op) return `${op.name}(${ast_to_js(ast.exp)})`
    }
    if (ast.type === AST_TYPES.conditional) {
        let then_ret = false
        let cond = ast_to_js(ast.condition)
        let then_clause = ast_to_js(ast.then_block)
        //wrap it
        then_clause = lambdawrap(then_clause, ast.then_block)
        if(ast.has_else) {
            let else_clause = ast_to_js(ast.else_block)
            else_clause = lambdawrap(else_clause, ast.else_block)
            return `ifcond(${cond}, ${then_clause}, ${else_clause})`
        } else {
            let else_clause = lambdawrap('null',null)
            return `ifcond(${cond}, ${then_clause},${else_clause})`
        }
    }
    if (ast.type === 'return') return `return ${ast_to_js(ast.exp)}`
    if (ast.type === AST_TYPES.keywordarg) return `${ast_to_js(ast.name)}:${ast_to_js(ast.value)}`
    console.log('converting to js', ast)
    throw new Error(`unknown AST node ${ast.type}`)
}
