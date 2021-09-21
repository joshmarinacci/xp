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
        this.globalAlpha = 1.0
    }
    get width() {
        return this.w
    }
    get height() {
        return this.h
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

    fillCircle(circle, color) {
        let ctx = this.canvas.getContext('2d')
        ctx.save()
        ctx.globalAlpha = this.globalAlpha
        ctx.fillStyle = color.toCSSColor()
        ctx.beginPath()
        ctx.arc(circle.x,circle.y,circle.r,0,2*Math.PI)
        ctx.fill()
        ctx.restore()
    }

    clear() {
        if(isBrowser()) {
            let ctx = this.canvas.getContext('2d')
            ctx.fillStyle = 'black'
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
        }
    }
}

