import {setup} from './emulator.js'
import {lerp, randf, randi, range, remap} from './util.js'
import {BLACK, hslToRgb, RED} from './colors.js'


let BG = setup()

// const COLORS = [
//     [255,0,0],
//     [0,255,0],
//     [0,0,255]
// ]
const HUES = range(20).map(() => randf(0.2, 0.5))

function pick(COLORS) {
    return COLORS[Math.floor(Math.random() * COLORS.length)]
}

const floor = Math.floor

class Rect {
    constructor(x1, y1, x2, y2, color) {
        this.x1 = floor(x1)
        this.y1 = floor(y1)
        this.x2 = floor(x2)
        this.y2 = floor(y2)
        this.color = color
        this.phase = randf(0,1)
        this.frequency = randf(0.2,1.5)
    }
    width() {
        return this.x2-this.x1
    }
    height() {
        return this.y2-this.y1
    }

    split(dir, amount) {
        if (dir === 'h') return [
            new Rect(
                this.x1, this.y1,
                lerp(amount, this.x1, this.x2), this.y2,
                pick(HUES)),
            new Rect(
                lerp(amount, this.x1, this.x2), this.y1,
                this.x2, this.y2,
                pick(HUES))
        ]
        if (dir === 'v') return [
            new Rect(
                this.x1, this.y1,
                this.x2, lerp(amount, this.y1, this.y2),
                pick(HUES)),
            new Rect(
                this.x1, lerp(amount, this.y1, this.y2),
                this.x2, this.y2,
                pick(HUES))
        ]
    }
}

const DIRECTIONS = ['h', 'v']
let rects = []

const to_string = (r) => `${r.x1} ${r.y1} -> ${r.x2} ${r.y2}`
const rects_to_string = (rects) => rects.map(to_string).join(",   ")

function recurse(rect, depth) {
    if (depth <= 0) return [rect]
    let dir = pick(DIRECTIONS)
    let [left, right] = rect.split(dir, randf(0.2, 0.8))
    return [
        ...recurse(left, depth - 1),
        ...recurse(right, depth - 1)
    ]
}

function setupRects(screen) {
    rects = recurse(new Rect(
        0,
        0,
        screen.width-1,
        screen.height-1, RED
    ),   4)
}

setupRects(BG, true)

function drawRect(screen, rect,sat,lit) {
    //fill the rect
    screen.fillRect(rect.x1,rect.y1, rect.width(),rect.height(),
        hslToRgb(rect.color,sat,lit)
    )
    //draw the borders
    screen.strokeRect(rect.x1,rect.y1,rect.width(),rect.height(),BLACK)
}

let count = 0
let slowness = 200
function drawRects(screen) {
    count++
    rects.forEach(rect =>  {
        // let t = ((count+randi(10,50)) % slowness)/slowness
        let t = remap(Math.sin(count/100*(0.5+rect.frequency) + rect.phase), -1,1,0,1)
        // let t = ((count+rect.phase) % slowness)/slowness
        if(t < 0.5) {
            t = t/2
        } else {
            t = 1-t
        }
        let sat = lerp(t,0.2,0.8)
        let lit = lerp(t,0.2,1.0)
        drawRect(screen, rect, sat, lit)
    })
}

setInterval(() => drawRects(BG), 10)
