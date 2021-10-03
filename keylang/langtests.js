import {eval_ast, make_grammar_semantics} from './grammar.js'
import {
    add,
    KeyColor,
    MDList,
    KObj,
    KPoint,
    KRect, KVector,
    STD_SCOPE
} from './libs_js/common.js'
import {checkEqual, force_delete, test_js} from './util.js'


const scope = STD_SCOPE


async function runtests() {
    const [grammar, semantics] = await make_grammar_semantics()
    function test_parse(code,res) {
        // console.log(`parsing: "${code}"`)
        let result = grammar.match(code,'Exp')
        if(!result.succeeded()) throw new Error(`failed parsing ${code}`)
        let ast = semantics(result).ast()
        // console.log('result is',ast)
    }
    function test_parse_fail(code,res) {
        console.log(`parsing for failure: "${code}"`)
        let result = grammar.match(code,'Exp')
        if(result.succeeded()) throw new Error("failed parsing")
    }
    function test_eval(scope,code,ans) {
        // console.log(`parsing: "${code}"`)
        let result = grammar.match(code,'Exp')
        if(!result.succeeded()) throw new Error("failed parsing")
        let ast = semantics(result).ast()
        let res = eval_ast(ast,scope)
        // console.log("comparing",res,ans)
        if(!checkEqual(res,ans)) throw new Error("not equal")
    }

    test_parse('4')
    test_parse('-4')
    test_parse('4.8')
    test_parse('0.5')
    test_parse("'foo'")
    test_parse(`"foo"`)
    test_parse('true')
    test_parse('false')

    // assignment
    test_parse('dot = 5')
    test_parse('dot = true')
    test_parse('dot = tod')

    //operations
    test_parse('4<5')
    test_parse('4<=5')
    test_parse('5>=4')

    //function call with positional arguments
    test_parse('foo()')
    test_parse('foo(5)')
    test_parse(`foo('bar')`)
    test_parse(`foo('bar','baz')`)
    test_parse(`foo('bar',foo('baz'))`)
    test_parse(`dot = foo('bar')`)
    test_parse('range(10).map()')

    //function call with keyword arguments
    test_parse(`foo()`)
    test_parse(`foo(x:5)`)
    test_parse(`foo(x:5,y:"foo")`)
    test_parse(`foo(y:'foo', x:5)`)
    test_parse(`foo(x:5,y:"foo")`)

    //property access
    test_parse("GET_PROP(dots,'length')")
    test_parse('fun foo() { }')

    test_parse_fail('1abc')
    test_parse_fail('0xFF')
    test_parse_fail('1.2.3')
    test_parse_fail(`"foo'`)
    test_parse_fail('else.part')
    test_parse_fail('var true')
    test_parse_fail('var if')
    test_parse_fail('var else')
    test_parse_fail('var fun')
    test_parse_fail('var and')
    test_parse('var andy')
    test_parse_fail('var or')
    test_parse('var orion')
    test_parse_fail('var not')
    test_parse('var nottingham')



    //conditonals
    test_parse(`if(true){}`)
    test_parse('a or b')
    test_parse('a and b')
    test_parse('not a')
    test_parse('a and not b')
    test_parse('a or not b')
    test_parse('if(a){b}')
    // test_parse('if a {b}')
    test_parse('if a b')


    // list literals
    test_parse('[0]')
    test_parse('[1,2]')
    test_parse('[1,2,3]')
    test_parse('[a,b,c]')
    test_parse('[4+5,5,"foo"]')


    //complex edge cases
    test_parse('r.x = 5')
    test_parse('(4)/2')
    test_parse('(screen.width - r.w)/2')
    test_parse('r.x = (screen.width - r.w)/2')

    //evaluations
    test_eval('','4',4)
    test_eval('','4.8',4.8)
    test_eval('',"'foo'","foo")
    test_eval('','4+5',9)
    test_eval('','true',true)
    test_eval('','false',false)
    test_eval('','true and true',true)
    test_eval('','true and false',false)
    test_eval('','true or false',true)
    test_eval('','false or true',true)
    test_eval('','false or false',false)
    test_eval('','not true',false)
    test_eval('','not false',true)
    test_eval('','if true 5',5)
    test_eval('','if (false) { 5 } else { 6 }',6)

    test_eval(scope,'List(0,0,0)',new MDList(0,0,0))
    test_eval(scope, '[0,0,0]', new MDList(0,0,0))
    test_eval(scope,'range(3)',new MDList(0,1,2))
    // test_eval(scope,`getPart(range(3),'get')`,new KList().get)
    test_eval(scope,'part = 3',3)
    // test_eval(scope,`foo = getPart(range(3),'get')`,new KList().get)
    // test_eval(scope,`getPart(range(3),'get')(1)`,1)
    // test_eval(scope, `() => {5}`,(x)=>{5})
    // test_eval(scope, `(x) => {add(x,1)}`,(x)=>{add(x,1)})
    // test_eval(scope, `range(3).map(() => {5})`,[5,5,5])
    // test_eval(scope, `range(3).map((x) => {add(x,1)})`,[1,2,3])

    await test_js(scope,`5`,5)
    await test_js(scope,`'foo'`,"foo")
    await test_js(scope,`add(4,5)`,9)
    await test_js(scope, '4.8',4.8)

    // operations
    await test_js(scope,'4<5',true)
    await test_js(scope,'4<=5',true)
    await test_js(scope, '5>=4', true)

    //functions
    await test_js(scope, 'List(0,1,2)',new MDList(0,1,2))
    await test_js(scope, 'range(3)',new MDList(0,1,2))
    await test_js(scope, `{ let palette = List() palette }`, new MDList())
    await test_js(scope, `{ let black = Color() black }`, new KeyColor({}))
    await test_js(scope, `{ let red = Color(r:1) red}`, new KeyColor({r:1}))
    await test_js(scope, `{ let black = KeyColor(red:0, blue:0, green:0) black }`, new KeyColor({red:0,blue:0,green:0}))
    await test_js(scope, `{ let gray = KeyColor(gray:0.5) gray }`, new KeyColor({red:0.5,blue:0.5,green:0.5}))
    await test_js(scope, `{ let red = KeyColor(hue:0, sat:1, lit:0.5) red }`, new KeyColor({hue:0,sat:1,lit:0.5}))
    // await test_js(scope, `{ let screen = Canvas(0,0,64,32) screen}`, new KCanvas(0,0,64,32))
    {
        await test_js(scope, `{
        let black = Color()
        let red = Color(r:1)
        let green = Color(g:1)
        let blue = Color(b:1)
        let palette = List(black,red,green,blue)
        palette
        }
        `, new MDList(new KeyColor({}), new KeyColor({r:1}), new KeyColor({g:1}), new KeyColor({b:1})))
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
        await test_js(scope, `List(4,4)+List(2,2)`,new MDList(6,6))
        await test_js(scope, `[4,4]+[2,2]`,new MDList(6,6))
        await test_js(scope, `4-2`,2)
        await test_js(scope, `4/2`,2)
        await test_js(scope, `4*2`,8)
    }

    // conditionals
    {
        await test_js(scope,`if(true) {4} else {5}`,4)
        await test_js(scope,`if(true) {4}`,4)
        await test_js(scope,`if(not true) {4} else {5}`,5)
        await test_js(scope,`if(true) {return 5}`,5)
        await test_js(scope,`if(true) {
            var foo = "barz"
            var foz = 5
            return 9
        }`,9)
        await test_js(scope,`{[1,2]}`,MDList(1,2))
        await test_js(scope,`{[1,2].map((x)=>{x*2})}`,MDList(2,4))
    }
    //returns
    {
        await test_js(scope,'if(true) return 42',42)
        await test_js(scope, 'if(true) 42',42)
        await test_js(scope,'add(4,2)',6)
        await test_js(scope,'return add(4,2)',6)
        await test_js(scope,'if(true) { return add(4,2 ) }',6)
        await test_js(scope,'if true 42',42)
        await test_js(scope,'if true add(4,2)',6)
        await test_js(scope, `{ if (true) {return 5} else {7} return 6}`, 5)
    }

}


runtests().then(()=>console.log("all tests pass"))
