import mocha from "mocha"
import {eval_ast, make_grammar, make_grammar_semantics} from './grammar.js'
import {KList, STD_SCOPE} from './lib.js'



const scope = STD_SCOPE

function checkEqual(A, B) {
    if(typeof A !== typeof B) throw new Error("different types", typeof  A, "not equal", typeof B)
    // don't compare functions if they already have the same name
    if(typeof A === 'function') return true
    // console.log("testing",A,B, A===B)
    if (A === B) return true
    if(typeof A === 'object') {
        // console.log("checking",A,B)
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
    }
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
        // console.log("comparing",res,ans)
        if(!checkEqual(res,ans)) throw new Error("not equal")
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

}


runtests().then(()=>console.log("all tests pass"))
