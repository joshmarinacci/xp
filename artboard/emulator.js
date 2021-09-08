import {BLACK, hslToRgb, RED, WHITE} from "./colors.js"
let WIDTH = 32
let HEIGHT = 32
let SCALE = 15

class PixelGrid {
    constructor(canvas, width,height,scale) {
        this.canvas = canvas
        this.width = width
        this.height = height
        this.scale = scale
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
    return new PixelGrid(canvas,WIDTH,HEIGHT,SCALE)
}
function drawTime(bg) {
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
// setInterval(()=> drawTime(BG),1*1000)
function drawMandle(BG) {
    function calc_pixel(cx, cy) {
        let i = 0
        let zx = 0
        let zy = 0
        do {
            let xt = zx * zy
            zx = zx * zx - zy * zy + cx
            zy = 2 * xt + cy
            i++
        }
        while (i < 255 && (zx * zx + zy * zy) < 4)
        return 255 -i
    }

    const range = (count) => {
        let arr = new Array(count)
        for (let i = 0; i < count; i++) {
            arr[i] = i
        }
        return arr
    }


    let rainbow = range(256).map(i => {
        let t = i/255
        let hue = lerp(t, 0.2,0.9)
        let sat = lerp(t,.8,1)
        let lit = lerp(t,.5,.5)
        return hslToRgb(hue,sat,lit)
        // return `hsl(${hue.toFixed(0)},${sat}%,${lit}%)`
    })
    console.log(rainbow)

    BG.forRect(0,0,WIDTH,HEIGHT,(x,y,i,j)=>{
        let xx = remap(x,0,WIDTH, -0.35,-0.15)
        let yy = remap(y,0,HEIGHT, -0.8,-0.6)
        let index = calc_pixel(xx,yy)
        BG.setRGB8(x,y,rainbow[index])
    })

}

// setInterval(()=>drawMandle(BG),1*1000)
// drawMandle(BG)

