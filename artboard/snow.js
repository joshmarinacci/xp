import {setup} from './emulator.js'
import {randf, randi, range} from './util.js'
import {BLACK, WHITE} from './colors.js'

let BG = setup()

function setup_snow(pixels) {
    let state = {
    }

    state.snow = range(50).map(i => {
        return {
            x:randi(0,pixels.width),
            y:randi(0,pixels.height),
            vx:randf(-0.1,0.1),
            vy:randf(0.1,0.8),
        }
    })

    return state
}

let state = setup_snow(BG)
function wrap(v,min,max) {
    if(v < min) v = max
    if(v > max) v = min
    return v
}
function draw_snow(BG,state) {
    BG.clear(BLACK)
    state.snow.forEach(flake => {
        flake.x = wrap(flake.x + flake.vx, 0, BG.width)
        flake.y = wrap(flake.y + flake.vy,0,BG.height)
        BG.setRGB8(flake.x,flake.y,WHITE)
    })
}

setInterval(()=>draw_snow(BG,state),1000/30)
