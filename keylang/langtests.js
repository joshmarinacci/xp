import mocha from "mocha"
import {ast_to_js, eval_ast, make_grammar, make_grammar_semantics} from './grammar.js'
import {KList, STD_SCOPE} from './lib.js'
import {mkdirs, write_to_file} from './util.js'



const scope = STD_SCOPE

function checkEqual(A, B) {
    if(typeof A !== typeof B) throw new Error("different types", typeof  A, "not equal", typeof B)
    // don't compare functions if they already have the same name
    if(typeof A === 'function') return true
    // console.log("testing",A,B, A===B)
    if (A === B) return true
    if(typeof A === 'object') {
        console.log("checking",A,B)
        let a_keys = Object.getOwnPropertyNames(A)
        let b_keys = Object.getOwnPropertyNames(B)
        if(a_keys.length !== b_keys.length) throw new Error("different number of keys")
        for(let i=0; i<a_keys.length; i++) {
            if(a_keys[i] !== b_keys[i]) throw new Error(`different keys ${a_keys[i]} != ${b_keys[i]}`)
        }
        Object.keys(A).forEach((key)=>{
            // console.log('checking',key,A[key])
            // console.log('checking',B[key])
            checkEqual(A[key],B[key])
        })
        return true
    }
    if( A !== B) throw new Error(`Not equal: ${A} ${B}`)
    return true
}


async function runtests() {
    const [grammar, semantics] = await make_grammar_semantics()
    function test_parse(scope,code,res) {
        console.log(`parsing: "${code}"`)
        let result = grammar.match(code,'Exp')
        if(!result.succeeded()) throw new Error("failed parsing")
        // console.log('result is',result.succeeded())
    }
    function test_eval(scope,code,ans) {
        console.log(`parsing: "${code}"`)
        let result = grammar.match(code,'Exp')
        if(!result.succeeded()) throw new Error("failed parsing")
        let ast = semantics(result).ast()
        let res = eval_ast(ast,scope)
        console.log("comparing",res,ans)
        if(!checkEqual(res,ans)) throw new Error("not equal")
    }
    async function test_js(scope, code, ans) {
        console.log(`parsing: "${code}"`)
        let result = grammar.match(code, 'Exp')
        if (!result.succeeded()) throw new Error("failed parsing")
        await mkdirs("temp")
        let ast = semantics(result).ast()
        let res = ast_to_js(ast)
        res = `import * as lib from "../lib.js"
        const add = lib.STD_SCOPE.add
export function doit() {
    return ${res}
}
//console.log("running the generated module")
doit()
        `
        // console.log("generated code", res)
        let pth = `temp/generated_${Math.floor(Math.random()*10000)}.js`
        await write_to_file(pth, res)
        try {
            let mod = await import("./"+pth)
            let fres = mod.doit()
            console.log("comparing", fres, ans)
            if (!checkEqual(fres, ans)) throw new Error("not equal")
        } catch (e) {
            console.log("error happened",e)
            throw e
        }
    }

    test_parse('','4')
    test_parse('','4.8')
    test_parse('',"'foo'")
    test_parse('','true')
    test_parse('','false')

    // assignment
    test_parse('','dot = 5')
    test_parse('','dot = true')
    test_parse('','dot = tod')

    //function call
    test_parse('','foo()')
    test_parse('','foo(5)')
    test_parse('',`foo('bar')`)
    test_parse('',`foo('bar','baz')`)
    test_parse('',`foo('bar',foo('baz'))`)
    test_parse('',`dot = foo('bar')`)

    //property access
    test_parse('',"GET_PROP(dots,'length')")

    test_eval('','4',4)
    test_eval('','4.8',4.8)
    test_eval('',"'foo'","foo")

    test_eval(scope,'List(0,0,0)',new KList(0,0,0))
    test_eval(scope,'range(3)',new KList([0,1,2]))
    test_eval(scope,`getPart(range(3),'get')`,new KList().get)
    test_eval(scope,'part = 3',3)
    test_eval(scope,`foo = getPart(range(3),'get')`,new KList().get)
    test_eval(scope,`getPart(range(3),'get')(1)`,1)
    // test_eval(scope, `() => {5}`,(x)=>{5})
    // test_eval(scope, `(x) => {add(x,1)}`,(x)=>{add(x,1)})
    // test_eval(scope, `range(3).map(() => {5})`,[5,5,5])
    // test_eval(scope, `range(3).map((x) => {add(x,1)})`,[1,2,3])

    await test_js(scope,`5`,5)
    await test_js(scope,`'foo'`,"foo")
    await test_js(scope,`add(4,5)`,9)

}


runtests().then(()=>console.log("all tests pass"))
