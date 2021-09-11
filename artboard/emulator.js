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
        x = Math.floor(x)
        y = Math.floor(y)
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
    strokeRect(x,y,w,h,color) {
        for(let i=x; i<x+w; i++) {
            this.setRGB8(i,y,color)
            this.setRGB8(i,y+h,color)
        }
        for(let j=y; j<y+h; j++) {
            this.setRGB8(x,j,color)
            this.setRGB8(x+w,j,color)
        }
    }
    clear(color) {
        this.fillRect(0,0,this.width,this.height,color)
    }
}


export function setup() {
    let canvas = document.createElement('canvas')
    canvas.width = WIDTH*SCALE
    canvas.height = HEIGHT*SCALE
    document.body.appendChild(canvas)
    return new PixelGrid(canvas,WIDTH,HEIGHT,SCALE)
}

