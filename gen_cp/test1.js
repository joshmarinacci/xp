import {promises as fs} from "fs"

let code = [
    { type:'init_var',  name:'running', value:false },
    { type:'event_handler', event:'touch', code:[
            { type:'toggle_var', name:'running'}
        ]},
    {
        type:'logic_handler', condition:'running', code:[
            { type: 'call', name:'key_type', args:['E']},
            { type: 'call', name:'wait',  args:[1]},
            { type: 'call', name:'mouse_click',  args:['left']},
            { type: 'call', name:'wait',  args:[5]},
        ]
    }
]
const log = (...args) => console.log(...args)
const comment = (...args) => `#${[...args].join(" ")}`
const indent = (arr) => arr.map(v => "    " + v)

function process_block(code,ctx) {
    let block = []
    code.forEach(line => {
        console.log("line is",line)
        if(line.type === 'call') {
            if(line.name === 'wait') {
                block.push(`time.sleep(${line.args.join(",")})`)
                return
            }
            if(line.name === 'key_type') {
                block.push(`keyboard.press(Keycode.${line.args[0]})`)
                block.push(`keyboard.release_all()`)
                return
            }
            if(line.name === 'mouse_click') {
                // mouse.click(Mouse.LEFT_BUTTON)
                block.push(`mouse.click(Mouse.LEFT_BUTTON)`)
                return
            }
            block.push(`${line.name}(${line.args.join(",")})`)
        }
        if(line.type === 'toggle_var') {
            block.push(`${line.name} = not ${line.name}`)
        }
    })
    ctx.whiles = ctx.whiles.concat(indent(block))
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

async function generate_code(code) {
    let ctx = {
        deps:[
            'time','board','neopixel','touchio','usb_hid','adafruit_hid',
            {from:'adafruit_hid.mouse','import':"Mouse"},
            {from:'adafruit_hid.keyboard','import':"Keyboard"},
            {from:'adafruit_hid.keycode', 'import':'Keycode'},
        ],
        inits:[
            'mouse = Mouse(usb_hid.devices)',
            'keyboard = Keyboard(usb_hid.devices)'
        ],
        whiles:[

        ]
    }
    code.forEach(line => {
        if(line.type === 'init_var') {
            //ctx.inits.push(comment("init var"))
            ctx.inits.push(`${line.name} = ${literalToPython(line.value)}`)
            return
        }
        if(line.type === 'event_handler') {
            if(line.event === 'touch') {
                ctx.inits.push(`touch = touchio.TouchIn(board.TOUCH)`)
                ctx.inits.push(`touch_state = False`)
                ctx.whiles.push('if touch.value and not touch_state:')
                ctx.whiles.push(indent(['touch_state = True']))
                ctx.whiles.push('if not touch.value and touch_state:')
                ctx.whiles.push(indent(['touch_state = False']))
                ctx.whiles.push(`if touch_state:`)
                process_block(line.code,ctx)
                return
            }
        }
        if(line.type === 'logic_handler') {
            ctx.whiles.push(`if ${line.condition}:`)
            process_block(line.code,ctx)
        }
        log(line)
    })
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


