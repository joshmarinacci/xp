import {isBrowser, KRect} from './common.js'

export class KCanvas extends KRect {
    constructor(x,y,w,h) {
        super(x,y,w,h)
        if(isBrowser()) {
            this.canvas = document.createElement('canvas')
            this.canvas.width = this.w
            this.canvas.height = this.h
            document.body.append(this.canvas)
        }
    }
    get width() {
        return this.w
    }
    get size() {
        return [this.w,this.h]
    }
    setPixel(xy,color) {
        if(isBrowser()) {
            let ctx = this.canvas.getContext('2d')
            let x = xy.get(0)
            let y = xy.get(1)
            // console.log("drawing at",x,y,color)
            ctx.fillStyle = color.toCSSColor()
            // console.log("fillstyle is",color.toCSSColor())
            ctx.fillRect(
                Math.floor(x),
                Math.floor(y),
                1,1
            )
        }
    }
    fillRect(rect,color) {
        // console.log("filling",rect,color)
        let ctx = this.canvas.getContext('2d')
        ctx.fillStyle = color.toCSSColor()
        ctx.fillRect(rect.x,rect.y,rect.w,rect.h)
    }
    strokeRect(rect,color) {
        let ctx = this.canvas.getContext('2d')
        ctx.strokeStyle = color.toCSSColor()
        ctx.strokeRect(rect.x,rect.y,rect.w,rect.h)
    }

    clear() {
        if(isBrowser()) {
            let ctx = this.canvas.getContext('2d')
            ctx.fillStyle = 'black'
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
        }
    }
}

