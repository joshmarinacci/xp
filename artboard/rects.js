import {setup} from './emulator.js'
import {lerp, randf, randi, range} from './util.js'
import {BLACK, hslToRgb, RED} from './colors.js'


let BG = setup()

// const COLORS = [
//     [255,0,0],
//     [0,255,0],
//     [0,0,255]
// ]
const COLORS = range(20).map(() => hslToRgb(randf(0, 1), 0.5, 0.5))

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
                pick(COLORS)),
            new Rect(
                lerp(amount, this.x1, this.x2), this.y1,
                this.x2, this.y2,
                pick(COLORS))
        ]
        if (dir === 'v') return [
            new Rect(
                this.x1, this.y1,
                this.x2, lerp(amount, this.y1, this.y2),
                pick(COLORS)),
            new Rect(
                this.x1, lerp(amount, this.y1, this.y2),
                this.x2, this.y2,
                pick(COLORS))
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
    ),   2)
}

setupRects(BG, true)

function drawRect(screen, rect) {
    //fill the rect
    screen.fillRect(rect.x1,rect.y1, rect.width(),rect.height(),rect.color)
    //draw the borders
    screen.strokeRect(rect.x1,rect.y1,rect.width(),rect.height(),BLACK)
}

function drawRects(screen) {
    rects.forEach(rect => {
        drawRect(screen, rect)
    })
}

setInterval(() => drawRects(BG), 1000)
