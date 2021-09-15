import {setupParser} from './parser.js'
let parser;

function log(...args) {
    console.log(...args)
}

function test(str) {
    log("parsing",str)
    let res = parser.grammar.match(str,)
    if(!res.succeeded()) {
        // log('failed',res)
        throw new Error("failed")
    } else {
        log("succeeded")
        log(parser.semantics(res).toPython())
    }
}

async function run_tests() {
    parser = await setupParser()
    test(`1`)
    test(`0.1`)
    test(`45`)
    test(`"foo"`)
    test(`'foo'`)
    test(`foo(5)`)
    test(`press("E")`)
    test(`keyboard_press("E")`)

    test(`[]`) // empty list
    test(`[1]`) //single element
    test(`[1,2]`) //two elements
    test(`[foo,bar]`) //identifier elements
    test(`[foo(bar)]`) //function call elements
    test(`foo(bar)`) //function call with ident
    test(`foo([5])`) //function call with list
    test(`bar = foo([5])`)
    test(`bar = foo([1,2,3,4,  5,  7])`)
    test(`bar = foo([1,2,3,4,
      5,  7])`)
    test(`
    heart = make_glyph([1,0,0,1,
                        1,1,1,1,
                        1,1,1,1,
                        0,1,1,0])
`)
    // test(`on forever do { 5 }`)
    // test('{ foo(5) } ')
    test(`on system forever do { print("bob") }`)
    test(`
    on button clicked do {
        modes_next()
    }
    `)
    test(`
    on system forever do {
        keyboard_press('E')
        wait(1)
        keyboard_releaseAll()
        wait(60)
    }
    `)

    test(`on system forever do {
        mouse_press('left')
        wait(5)
        mouse_releaseAll()
    }`)
    test(`
    #foo
    `)

    test(`
on system forever do {
    keyboard_press('E')
    #wait(1)
    keyboard_releaseAll()
    wait(60)
}
on system forever do {
    mouse_press('left')
    wait(5)
    mouse_releaseAll()
}
`)
    test(`
on button clicked do {
    mode_running = not mode_running
}
    `)
    test(`
on system forever do {
    if mode_running {
        print("pressing E")
    }
}
    `)
    test(`
on system start do {
    mode_running = false
}
    `)
    test(`
    on system start do {
        print("starting")
        #   modes := ring()
        #   modes.add(
    }
    `)

    // identifiers with dots
    test(`grid.set(5)`)
}

run_tests().then(()=>console.log("tests complete"))
