import {promises as fs} from "fs"

let code = [
    { type:'init_var',  name:'running', value:false },
    { type:'event_handler', event:'touch', code:[
            { type:'toggle_var', name:'running'}
        ]},
    {
        type:'logic_handler', condition:'running', code:[
            //wait 1 then key_type('E')
            { type: 'call', name:'wait',  args:[1], then:[{ type: 'call', name:'key_type', args:['E']}]},
            { type: 'call', name:'wait',  args:[5], then:[{type: 'call', name:'mouse_click',  args:['left']}]},
        ]
    }
]
const log = (...args) => console.log(...args)
const comment = (...args) => `#${[...args].join(" ")}`
const indent = (arr) => arr.map(v => "    " + v)

const add_all = (src,dst) => {
    src.forEach(el => dst.push(el))
}
let VAR_COUNT = 0

let LIBS = {
    "touch":{
        deps:["touchio"],
        inits:[]
    },
    "mouse":{
        deps:[{from:'adafruit_hid.mouse','import':"Mouse"}, ],
        inits:[
            'mouse = Mouse(usb_hid.devices)',
        ]
    },
    "keyboard":{
        deps:[{from:'adafruit_hid.keyboard','import':"Keyboard"},
            {from:'adafruit_hid.keycode', 'import':'Keycode'},],
        inits:['keyboard = Keyboard(usb_hid.devices)']
    }
}

function process_block(code,ctx) {
    let block = []
    code.forEach(line => {
        if(line.type === 'call') {
            if(line.name === 'wait') {
                VAR_COUNT++
                ctx.inits.push(`timeout${VAR_COUNT} = time.monotonic()`)
                block.push("now = time.monotonic()")
                block.push(`if now > timeout${VAR_COUNT} + ${line.args[0]}:`)
                block.push(`    timeout${VAR_COUNT} = now`)
                block.push(`    print("doing ${VAR_COUNT}")`)
                add_all(process_block(line.then,ctx),block)
                return
            }
            if(line.name === 'key_type') {
                add_all(LIBS.keyboard.deps,ctx.deps)
                add_all(LIBS.keyboard.inits,ctx.inits)
                block.push(`keyboard.press(Keycode.${line.args[0]})`)
                block.push(`keyboard.release_all()`)
                return
            }
            if(line.name === 'mouse_click') {
                add_all(LIBS.mouse.deps,ctx.deps)
                add_all(LIBS.mouse.inits,ctx.inits)
                block.push(`mouse.click(Mouse.LEFT_BUTTON)`)
                return
            }
            block.push(`${line.name}(${line.args.join(",")})`)
        }
        if(line.type === 'toggle_var') {
            block.push(`${line.name} = not ${line.name}`)
            block.push(`print("set ${line.name} to ",${line.name})`)
        }
    })
    //ctx.whiles = ctx.whiles.concat(indent(block))
    return indent(block)
}

function render_imports(deps) {
    let lines = []
    deps.forEach(dep => {
        if(typeof dep === 'string') return lines.push("import "+dep)
        lines.push(`from ${dep.from} import ${dep['import']}`)

    })
    return lines.join("\n")
}

function literalToPython(value) {
    if(typeof value === 'boolean') return value?"True":"False"
    return value
}

function process_string_block(strings, ctx) {
    let block = strings
    ctx.whiles = ctx.whiles.concat(indent(block))
}

async function generate_code(code) {
    let ctx = {
        deps:[
            'time','board','usb_hid',
        ],
        inits:[ ],
        whiles:[ ]
    }
    code.forEach(line => {
        if(line.type === 'init_var') {
            //ctx.inits.push(comment("init var"))
            ctx.inits.push(`${line.name} = ${literalToPython(line.value)}`)
            return
        }
        if(line.type === 'event_handler') {
            if(line.event === 'touch') {
                add_all(LIBS.touch.deps,ctx.deps)
                ctx.inits.push(`touch = touchio.TouchIn(board.TOUCH)`)
                ctx.inits.push(`touch_state = False`)
                ctx.whiles.push('if touch.value and not touch_state:')
                process_string_block([
                    'touch_state = True',
                    'print("Touch true")'],ctx)
                ctx.whiles.push('if not touch.value and touch_state:')
                process_string_block([
                    'touch_state = False',
                    'print("Touch false")'],ctx)
                // ctx.whiles.push(`if touch_state:`)
                add_all(process_block(line.code,ctx),ctx.whiles)
                return
            }
        }
        if(line.type === 'logic_handler') {
            ctx.whiles.push(`if ${line.condition}:`)
            // ctx.whiles.push(`    print("running")`)
            add_all(process_block(line.code,ctx),ctx.whiles)
        }
        log(line)
    })
    ctx.whiles.push("time.sleep(0.1)")
    return [
        render_imports(ctx.deps),
        ctx.inits.join("\n"),
        ("while True:\n" +indent(ctx.whiles).join("\n"))
    ].join("\n")
}

async function write_to(output, outpath) {
    log('writing to',outpath)
    await fs.writeFile(outpath,output.toString())
}

async function doit() {
    let output = await generate_code(code)
    let outpath = "/Volumes/CIRCUITPY/code.py"
    await write_to(output,outpath)
    log(output)
}
doit().then(()=>log("done"))


