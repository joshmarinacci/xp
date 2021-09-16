import mocha from "mocha"
import {make_grammar, make_grammar_semantics} from './grammar.js'
import {deepStrictEqual}  from 'assert'

const prelude = `
black = [0,0,0]
red = [1,0,0]
...
palette = [black, red,green,blue,cyan,yellow,purple,white]
function MakeDot() {
let dot = MakeObject()
dot.xy = Point(randi(0,screen.width), randi(0,1))
dot.v =  Vector(randf(-0.1,0.1), randf(0.5,1.5))
dot.color = chooseIndex(palette)
}
dots = range(20).map(()=>MakeDot())
dots[0].xy = Point(1,2)
dots[0].v = Vector(1,2)
`

function eval_ast(ast,scope) {
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
    throw new Error("eval ast not implemented")
}
class KList {
    constructor(...args) {
        this.data = []
        args.forEach(arg => {
            if(Array.isArray(arg)) {
                this.data.push(...arg)
            }
        })
        this.get = (index)=>this.data[index]
    }
    // get(index) {
    //     console.log(`KList.get(${index})`)
    //     return this.data[index]
    // }
}

const scope = {
    List:(...args)=>{
        // console.log("got the args",...args)
        return new KList(...args)
    },
    getPart:(obj,name) => {
        // let proto = Object.getPrototypeOf(obj)
        // console.log("obj",obj,'name',name)
        // console.log("proto is",proto)
        // console.log("proto names",Object.getOwnPropertyNames(proto))
        // console.log("trying index",obj['get'])
        // console.log('get part returning',name,'from',obj,
        //     Object.getPrototypeOf(obj)[name])
        // console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(obj)))
        // console.log("methods",getMethods(obj))
        return obj[name]
    },
    range:(...args)=> {
        let arr = []
        for(let i=0; i<args[0]; i++) {
            arr[i]= i
        }
        let list = new KList(arr)
        console.log('testing the list',list.get(1))
        return list
    }
}


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

    // test_parse(prelude,'dots.length == 20',true)
    // test_parse(prelude,'palette.get(2)',[0,1,0])
    // test_parse(prelude,'dots.get(0).xy',[1,2])
    // test_parse(prelude,'add(dots.get(0).xy,dots.get(0).v)',[2,4])
    //
    function test_eval(scope,code,ans) {
        console.log(`parsing: "${code}"`)
        let result = grammar.match(code,'Exp')
        if(!result.succeeded()) throw new Error("failed parsing")
        let ast = semantics(result).ast()
        let res = eval_ast(ast,scope)
        // console.log("comparing",res,ans)
        if(!checkEqual(res,ans)) throw new Error("not equal")
    }
    test_eval('','4',4)
    test_eval('','4.8',4.8)
    test_eval('',"'foo'","foo")

    const getMethods = (obj) => {
        let properties = new Set()
        let currentObj = obj
        do {
            Object.getOwnPropertyNames(currentObj).map(item => properties.add(item))
        } while ((currentObj = Object.getPrototypeOf(currentObj)))
        return [...properties.keys()].filter(item => typeof obj[item] === 'function')
    }
    test_eval(scope,'List(0,0,0)',new KList(0,0,0))
    test_eval(scope,'range(3)',new KList([0,1,2]))
    // test_eval(scope,`getPart(range(3),'get')`,new KList().get)
    test_eval(scope,'part = 3',3)
    // test_eval(scope,`foo = getPart(range(3),'get')`,new KList().get)
    test_eval(scope,`getPart(range(3),'get')(1)`,1)
    // test_eval(scope,`part = getPart(range(3),'get')`,1)
    // test_eval(scope,`part = getPart(range(3),'get')
    // part(1)
    // `,1)
    // test_eval(scope, `range(3).map(x => add(x,1))`,[1,2,3])
    return
    test_eval(scope,`
function MakeDot() {
    let dot = MakeObject()
    dot.xy = Point(randi(0,screen.width), randi(0,1))
    dot.v =  Vector(randf(-0.1,0.1), randf(0.5,1.5))
    dot.color = chooseIndex(palette)
}
dots = range(20).map(()=>MakeDot())
dot = dots.get(0)
dot.xy = Point(1,2)
dot.v = Vector(1,2)
dot.xy = dot.xy + dot.v
dot.xy
`)
    // test_eval(scope,'black = List(0,0,0)',[0,0,0])
    // test_eval(prelude,'palette.get(2)',[0,1,0])
    // test_eval(prelude,'dots.get(0).xy',[1,2])
    // test_eval(prelude,'add(dots.get(0).xy,dots.get(0).v)',[2,4])
}


runtests().then(()=>console.log("all tests pass"))
