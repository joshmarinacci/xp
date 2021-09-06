import {promises as fs} from "fs"

let code = [
    { type:'init_var',  name:'running', value:false },
    { type:'event_handler', event:'button', code:[
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
    'board':{
        deps:['board'],
        inits:[],
    },
    'time':{
        deps:['time'],
        inits:[],
    },
    "touch":{
        deps:["touchio"],
        inits:[
            `touch = touchio.TouchIn(board.TOUCH)`,
            `touch_state = False`,
        ]
    },
    "mouse":{
        deps:[
            {from:'adafruit_hid.mouse','import':"Mouse"},
            'usb_hid'],
        inits:[
            'mouse = Mouse(usb_hid.devices)',
        ]
    },
    "keyboard":{
        deps:[
            {from:'adafruit_hid.keyboard','import':"Keyboard"},
            {from:'adafruit_hid.keycode', 'import':'Keycode'},
            'usb_hid'],
        inits:['keyboard = Keyboard(usb_hid.devices)']
    },
    "button":{
        deps:[
            {from:'digitalio', import:['DigitalInOut', 'Pull']}
        ]
    }
}

function process_block(code,ctx) {
    let block = []
    code.forEach(line => {
        if(line.type === 'call') {
            if(line.name === 'wait') {
                VAR_COUNT++
                ctx.addLib(LIBS.time)
                ctx.inits.push(`timeout${VAR_COUNT} = time.monotonic()`)
                block.push("now = time.monotonic()")
                block.push(`if now > timeout${VAR_COUNT} + ${line.args[0]}:`)
                block.push(`    timeout${VAR_COUNT} = now`)
                block.push(`    print("doing ${VAR_COUNT}")`)
                add_all(process_block(line.then,ctx),block)
                return
            }
            if(line.name === 'key_type') {
                ctx.addLib(LIBS.keyboard)
                block.push(`keyboard.press(Keycode.${line.args[0]})`)
                block.push(`keyboard.release_all()`)
                return
            }
            if(line.name === 'mouse_click') {
                ctx.addLib(LIBS.mouse)
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


function literalToPython(value) {
    if(typeof value === 'boolean') return value?"True":"False"
    return value
}

function process_string_block(strings, ctx) {
    let block = strings
    ctx.whiles = ctx.whiles.concat(indent(block))
}


class PyFile {
    constructor() {
        this.deps = []
        this.inits = []
        this.whiles = []
    }
    addDep(dep) {
        this.deps.push(dep)
    }
    addDeps(deps) {
        add_all(deps,this.deps)
    }
    render_imports() {
        let singles = {}
        let imports = []
        this.deps.forEach(dep => {
            if(typeof dep === 'string') {
                singles[dep] = true
            } else {
                imports.push(`from ${dep.from} import ${dep['import']}`)
            }
        })
        return [
            ...Object.keys(singles).map(name => 'import '+name),
            ...imports
        ].join("\n")
    }

    addLib(lib) {
        if(lib.deps)  this.addDeps(lib.deps)
        if(lib.inits) add_all(lib.inits,this.inits)
    }
}

async function generate_code(code) {
    let ctx = new PyFile()
    ctx.addLib(LIBS.board)
    code.forEach(line => {
        if(line.type === 'init_var') {
            //ctx.inits.push(comment("init var"))
            ctx.inits.push(`${line.name} = ${literalToPython(line.value)}`)
            return
        }
        if(line.type === 'event_handler') {
            if(line.event === 'touch') {
                ctx.addLib(LIBS.touch)
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
            if(line.event === 'button') {
                ctx.addLib(LIBS.button)
                ctx.inits.push(`button = DigitalInOut(board.SWITCH)`)
                ctx.inits.push(`button.switch_to_input(pull=Pull.DOWN)`)
                ctx.inits.push('button_state = False')
                ctx.whiles.push('if button.value and not button_state:')
                process_string_block([
                    'button_state = True',
                    'print("button true")'],ctx)
                ctx.whiles.push('if not button.value and button_state:')
                process_string_block([
                    'button_state = False',
                    'print("button false")'],ctx)
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
        ctx.render_imports(),
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


