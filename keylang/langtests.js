import mocha from "mocha"
import {ast_to_js, eval_ast, make_grammar, make_grammar_semantics} from './grammar.js'
import {add, KCanvas, KColor, KList, KObj, KPoint, KRect, KVector, STD_SCOPE} from './lib.js'
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
        console.log("initial res is",res)
        if(Array.isArray(res)) {
            let last = res[res.length-1]
            last = 'return '+last
            // console.log('last is',last)
            res[res.length-1] = last
            res = res.join("\n")
        } else {
            res = 'return ' + res
        }
        let imports = Object.keys(STD_SCOPE).map(key => {
            return `const ${key} = lib.STD_SCOPE.${key}`
        }).join("\n")
        res = `import * as lib from "../lib.js"
        ${imports}
export function doit() {
    ${res}
}
//console.log("running the generated module")
doit()
        `
        console.log("generated code", res)
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
    test_parse('','-4')
    test_parse('','4.8')
    test_parse('','0.5')
    test_parse('',"'foo'")
    test_parse('',`"foo"`)
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
    test_parse('','range(10).map()')

    //property access
    test_parse('',"GET_PROP(dots,'length')")
    test_parse('','fun foo() { }')

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
    await test_js(scope, '4.8',4.8)
    await test_js(scope, 'List(0,1,2)',new KList(0,1,2))
    await test_js(scope, 'range(3)',new KList(0,1,2))
    await test_js(scope, `{ let palette = List() palette }`, new KList())
    await test_js(scope, `{ let black = Color(0,0,0) black }`, new KColor(0,0,0))
    await test_js(scope, `{ let red = Color(1,0,0) red}`, new KColor(1,0,0))
    await test_js(scope, `{ let screen = Canvas(0,0,64,32) screen}`, new KCanvas(0,0,64,32))
    {
        await test_js(scope, `{
        let black = Color(0,0,0)
        let red = Color(1,0,0)
        let green = Color(0,1,0)
        let blue = Color(0,0,1)
        let palette = List(black,red,green,blue)
        palette
        }
        `, new KList(new KColor(0, 0, 0), new KColor(1, 0, 0), new KColor(0, 1, 0), new KColor(0, 0, 1)))
    }
    await test_js(scope, '{let dot = Obj() dot}', new KObj())
    await test_js(scope, '{let dot = Obj() dot.five = 5 dot.five}', 5)

    {
        let dot = new KObj()
        dot.xy = new KPoint(5, 6)
        dot.v =  new KVector(1,1)
        dot.xy = add(dot.xy,dot.v)
        await test_js(scope, `{
            let dot = Obj() 
            dot.xy = Point(5,6) 
            dot.v = Vector(1,1) 
            dot.xy = add(dot.xy , dot.v) 
            dot}`, dot)
    }

    {
        await test_js(scope, '{let screen = Rect(0,0,64,32) screen}',new KRect({w:64, h:32}))
    }
    {
        await test_js(scope, `{range(10).map(()=>{5}).length}`, 10)
        await test_js(scope, `{let dots = range(20).map( ()=>{Obj()} ) dots.length}`, 20)
    }

    {
        await test_js(scope, `4+2`,6)
        await test_js(scope, `List(4,4)+List(2,2)`,new KList(6,6))
        await test_js(scope, `4-2`,2)
        await test_js(scope, `4/2`,2)
        await test_js(scope, `4*2`,8)
    }
}


runtests().then(()=>console.log("all tests pass"))
