import ohm from 'ohm-js'

let grammar = ohm.grammar(`
easy {
    Exp = OnBlock | Block | FuncallExp | ident | number | string | comment
    Block = "{" Exp* "}"
    OnBlock = "on" OnKeyword "do" Block
    OnKeyword = "forever" | "button_clicked"
    ident  (an identifier)
        = letter (letter | digit | under)*
    number  (a number)
        = digit+
    under = "_"
    q = "\\'"
    qq = "\\""
    comment = "#" toEOL
    toEOL = (~"\\n" any)* "\\n" 
    
    string (text string)
        = q (~q any)* q
        | qq (~qq any)* qq
    FuncallExp = ident "(" ListOf<Exp,","> ")"
}   
`)


let semantics = grammar.createSemantics()

function l(...args) {
    log(...args)
}

semantics.addOperation('toPython', {
    number:(a) => parseInt(a.sourceString),
    string:(a,b,c)=>`"${b.sourceString}"`,
    FuncallExp:(a,b,c,d) => ({type:"funcall", name:a.toPython(), args:c.asIteration().children.map(x => x.toPython())}),
    Block:(a,c,d) => ({type:'block',contents:c.toPython()}),
    OnBlock:(a,b,c,d) => ({type:'on',kind:b.toPython(), block:d.toPython()}),
    ident:(a,b) => a.sourceString + b.sourceString,
    _iter:(children) => children.map(c => c.toPython()),
    _terminal:function() { return this.sourceString },
    comment:(h,a) => ({type:'comment', comment:a.sourceString}),
})

function log(...args) {
    console.log(...args)
}

function test(str) {
    log("parsing",str)
    let res = grammar.match(str,)
    if(!res.succeeded()) {
        log('failed',res)
    }
    // log("succeeded")
    log(semantics(res).toPython())
}

test(`1`)
test(`45`)
test(`"foo"`)
test(`'foo'`)
test(`foo(5)`)
test(`press("E")`)
test(`keyboard_press('E')`)
test(`on forever do { 5 }`)
test('{ foo(5) } ')
test(`on forever do { print("bob") }`)
test(`
on button_clicked do {
    modes_next()
}
`)
test(`
on forever do {
    keyboard_press('E')
    wait(1)
    keyboard_releaseAll()
    wait(60)
}
`)

test(`on forever do {
    mouse_press('left')
    wait(5)
    mouse_releaseAll()
}`)
test(`#foo
`)
// test(`
// on start do {
//     print("starting")
//     #   modes := ring()
//     #   modes.add(
// }
// `)
