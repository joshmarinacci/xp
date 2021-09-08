import {setup} from './emulator.js'
import {randf, randi, range} from './util.js'
import {BLACK, GRAY8, RED, WHITE} from './colors.js'

const FLAKE_COUNT = 50
let pixelGrid = setup()

class Matrix {
    constructor(w,h) {
        this.w = w
        this.h = h
        this.fill(0)
    }
    fill(value) {
        this.data = range(this.w*this.h).map(()=>value)
    }
    get(x,y) {
        let n = this.xyToIndex(x,y)
        return this.data[n]
    }
    set(x,y,v) {
        let n = this.xyToIndex(x,y)
        this.data[n] = v
    }

    xyToIndex(x, y) {
        return x + y * this.w
    }
    forEach(cb) {
        for(let y=0; y<this.h; y++) {
            for(let x=0; x<this.w; x++) {
                cb(x,y,this.get(x,y))
            }
        }
    }
}
function reset_snow(pixels,state) {
    state.snow.forEach(flake => flake.alive = true)
    state.grid.fill(0)
    //platform
    let left = randi(0,pixels.width/2)
    let right = randi(pixels.width/2, pixels.width)
    let top = randi(pixels.height/2, pixels.height-2)
    range(left,right).forEach(i=>state.grid.set(i,top,2))
    //bottom
    range(0,pixels.width).forEach(i=>{
        state.grid.set(i,pixels.height-1,2)
    })
    console.log("running with flake count", FLAKE_COUNT)
}
function setup_snow(pixels) {
    let state = { }
    state.snow = range(FLAKE_COUNT).map(i => {
        return {
            x:randi(0,pixels.width),
            y:randi(0,pixels.height/2),
            vx:randf(-0.1,0.1),
            vy:randf(0.1,0.8),
            alive:true,
        }
    })
    state.grid = new Matrix(pixels.width,pixels.height)

    reset_snow(pixels,state)
    return state
}

let state = setup_snow(pixelGrid)
function wrap(v,min,max) {
    if(v < min) v = max
    if(v > max) v = min
    return v
}
function draw_snow(pixels,state) {
    pixels.clear(BLACK)
    let live_count = 0
    state.snow.forEach(flake => {
        if(flake.alive) live_count++
        if(!flake.alive) return
        flake.x = wrap(flake.x + flake.vx, 0, pixels.width)
        let ix = Math.round(flake.x)
        let iy = Math.round(flake.y)
        let ty = Math.round(flake.y+flake.vy)
        if(state.grid.get(ix,ty) > 0 || ty > pixels.height-1) {
            if(iy === 0) {
                flake.alive = false
                return
            }
            state.grid.set(ix,iy,1)
            flake.y = 0
            flake.x = randi(0,pixels.width)
        } else {
            flake.y = flake.y + flake.vy
            pixels.setRGB8(flake.x,flake.y,WHITE)
        }
    })
    state.grid.forEach((x,y,v) => {
        if(v === 1) pixels.setRGB8(x,y,GRAY8)
        if(v === 2) pixels.setRGB8(x,y,RED)
    })
    if(live_count <= FLAKE_COUNT/4) {
        reset_snow(pixels,state)
    }
}

setInterval(()=>draw_snow(pixelGrid,state),1000/30)
