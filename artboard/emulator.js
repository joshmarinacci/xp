let WIDTH = 32
let HEIGHT = 32
let SCALE = 15

class PixelGrid {
    constructor(canvas) {
        this.canvas = canvas
    }

    setRGB8(x, y, co){
        let c = this.canvas.getContext('2d')
        c.fillStyle = `rgba(${co[0]},${co[1]},${co[2]})`
        c.fillRect(x*SCALE,y*SCALE,SCALE,SCALE)
    }

    forRect(x,y,w,h,cb) {
        for(let j=y; j<y+h; j++) {
            for(let i=x; i<x+w; i++) {
                cb(i,j,i-x,j-y)
            }
        }
    }

    drawGlyph(x,y,g,color) {
        // this.log("drawing",x,y,color,g)
        this.forRect(x,y,g.w,g.h,(x,y,i,j) => {
            let n = i%g.w + j*g.w
            // this.log("pixel",i,j,xi,yj,'   ',n, Math.floor(yj*g.w))
            if(g.data[n] === 1) {
                this.setRGB8(x,y, color)
            }
        })
    }

    log(...args) {
        console.log("PG:",...args)
    }

    fillRect(x, y, w, h, color) {
        this.forRect(x,y,w,h,(x,y,i,j)=>{
            this.setRGB8(x,y,color)
        })
    }
}

function range(v1,v2) {
    if(typeof v2 === 'undefined') {
        return range(0,v1)
    } else {
        let arr = new Array(v2-v1)
        for(let i=v1; i<v2; i++) {
            arr.push(i)
        }
        return arr
    }
}

const NUMBER_FONT = {
    0: {
        w: 3,
        h: 5,
        data: [
            1,1,1,
            1,0,1,
            1,0,1,
            1,0,1,
            1,1,1,
        ]
    },
    1: {
        w: 3,
        h: 5,
        data: [
            0,1,0,
            0,1,0,
            0,1,0,
            0,1,0,
            0,1,0,
        ]
    },
    2: {
        w:3,
        h:5,
        data:[
            1,1,1,
            0,0,1,
            1,1,1,
            1,0,0,
            1,1,1,
        ]
    },
    3: { w:3, h:5, data:[
            1,1,1,
            0,0,1,
            1,1,1,
            0,0,1,
            1,1,1,
        ] },
    4: { w:3, h:5, data:[
            1,0,1,
            1,0,1,
            1,1,1,
            0,0,1,
            0,0,1,
        ] },
    5: { w:3, h:5, data:[
            1,1,1,
            1,0,0,
            1,1,1,
            0,0,1,
            1,1,1,
        ] },
    6: { w:3, h:5, data:[
            1,1,1,
            1,0,0,
            1,1,1,
            1,0,1,
            1,1,1,
        ] },
    7: { w:3, h:5, data:[
            1,1,1,
            0,0,1,
            0,1,0,
            0,1,0,
            0,1,0,
        ] },
    8: { w:3, h:5, data:[
            1,1,1,
            1,0,1,
            1,1,1,
            1,0,1,
            1,1,1,
        ] },
    9: { w:3, h:5, data:[
            1,1,1,
            1,0,1,
            1,1,1,
            0,0,1,
            0,0,1,
        ] },
    ':':{
        w:1,
        h:5,
        data:[
            0,
            1,
            0,
            1,
            0,
        ]
    }
}

const RED = [255,0,0]
const BLACK = [0,0,0]
const WHITE = [255,255,255]

function num_to_double_digits(hours) {
    let chars = []
    if(hours < 10) {
        chars.push(0)
        chars.push(hours%10)
    } else {
        chars.push(Math.floor(hours/10))
        chars.push(hours%10)
    }
    return chars
}

export function setup() {
    let canvas = document.createElement('canvas')
    canvas.width = WIDTH*SCALE
    canvas.height = HEIGHT*SCALE
    document.body.appendChild(canvas)

    let bg = new PixelGrid(canvas)
    // bg.setRGB8(0,0, 0,255,0)
    // range(0,16).map(i => {
    //     bg.setRGB8(i,0,255,0,0)
    // })
    // bg.forRect(5,5,10,10,(x,y)=>{
    //     bg.setRGB8(x,y,0,0,255)
    // })

    function drawTime() {
        let now = new Date()
        let chars = []
        chars = [
            ...num_to_double_digits(now.getHours()),
            ':',
            ...num_to_double_digits(now.getMinutes()),
            ':',
            ...num_to_double_digits(now.getSeconds()),
        ]
        let x = 0;
        let y = 10
        bg.fillRect(0,0,32,32,BLACK)
        x += 2
        y += 3
        chars.forEach(ch => {
            let g = NUMBER_FONT[ch]
            bg.drawGlyph(x,y,g,RED)
            x += (g.w + 1)
            if (x > 30) {
                x = 0
                y += 6
            }
        })
    }
    drawTime()
    setInterval(drawTime,1*1000)
}
setup()
