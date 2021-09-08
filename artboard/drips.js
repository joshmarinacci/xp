import {BLACK, hslToRgb} from './colors.js'
import {setup} from './emulator.js'
import {range,lerp,remap,randi,randf} from "./util.js"

let RANDOM = {}

function setupRandomWalk(screen) {
    let rainbow = range(256).map(i => {
        let t = i/255
        let hue = lerp(t, 0.2,0.9)
        let sat = lerp(t,.8,0.99)
        let lit = lerp(t,.5,.5)
        return hslToRgb(hue,sat,lit)
    })
    let grayscale = range(256).map(i => {
        let v = remap(i, 0,256, 100,200)
        return [v,v,v]
    })
    let r  = RANDOM
    r.dots = []
    range(20).forEach(i => {
        let dot = {
            x: randi(0, screen.width),
            y: randi(0, 1),
            vx: randf(-0.1,0.1),
            vy: randf(0.5,1.5),
            color: rainbow[randi(0,256)],
        }
        r.dots.push(dot)
    })
    screen.fillRect(0,0,screen.width, screen.height, BLACK)
}
function drawRandomWalk(screen, clear=false) {
    let r = RANDOM
    //move the dots randomly in a direction
    if(clear) screen.fillRect(0,0,screen.width,screen.height, BLACK)

    r.dots.forEach(dot => {
        dot.x += dot.vx
        dot.y += dot.vy
        if(dot.x < 0) dot.x = screen.width-1
        if(dot.y < 0) dot.y = screen.height-1
        if(dot.x >= screen.width) dot.x = 0
        if(dot.y >= screen.height) dot.y = 0
    })
    r.dots.forEach(dot => {
        screen.setRGB8(Math.floor(dot.x),Math.floor(dot.y),dot.color)
    })
}



let BG = setup()
setupRandomWalk(BG,true)
setInterval(()=>drawRandomWalk(BG),100)
