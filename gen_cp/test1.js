//write the code
//generate the code
//click 15 times, 0.1 secs each, then wait 60 seconds
/*

running = false //init var
on touch //event handler
    toggle running //set var
while running //logic handler
    key type E //function call =>
    time wait 1, //function call
    mouse click left, //function call
    time wait 5 seconds //function call

 */
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
            block.push(`${line.name} = !${line.name}`)
        }
    })
    ctx.whiles = ctx.whiles.concat(indent(block))
}
async function generate_code(code) {
    let ctx = {
        deps:['time','board','neopixel','touchio','usb_hid'],
        inits:[
            'mouse = adafruit_hid.mouse.Mouse(usb_hid.devices)'
        ],
        whiles:[

        ]
    }
    code.forEach(line => {
        if(line.type === 'init_var') {
            //ctx.inits.push(comment("init var"))
            ctx.inits.push(`${line.name} = ${line.value}`)
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
        ctx.deps.map(im => "import "+im).join("\n"),
        ctx.inits.join("\n"),
        ("while True:\n" +indent(ctx.whiles).join("\n"))
    ].join("\n")
}


generate_code(code).then((v)=>log(v))


