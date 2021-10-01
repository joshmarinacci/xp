import {isBrowser, KRect} from './common.js'

export class KCanvas extends KRect {
    constructor(x,y,w,h,scale) {
        super(x,y,w,h)
        this.scale = 1
        if(typeof scale === 'number') this.scale = scale
        if(isBrowser()) {
            this.canvas = document.createElement('canvas')
            this.canvas.width = this.w*this.scale
            this.canvas.height = this.h*this.scale
            this.canvas.style.width = `${this.w*this.scale/window.devicePixelRatio}px`
            this.canvas.style.height = `${this.h*this.scale/window.devicePixelRatio}px`
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

    drawPolyLine(line,color) {
        let ctx = this.canvas.getContext('2d')
        ctx.save()
        ctx.scale(2,2)
        ctx.translate(0.5,0.5)
        ctx.strokeStyle = color.toCSSColor()
        // ctx.strokeStyle = 'black'
        ctx.lineWidth = 0.1
        ctx.beginPath()
        for(let i=0; i<line.length; i++) {
            let pt = line.get1(i)
            if(i === 0) {
                ctx.moveTo(pt.get1(0),pt.get1(1))
            } else {
                ctx.lineTo(pt.get1(0),pt.get1(1))
            }
        }
        ctx.stroke()
        ctx.restore()
    }

    drawImage(xy,img) {
        // console.log("drawing image at",xy,img)
        if(isBrowser()) {
            let ctx = this.canvas.getContext('2d')
            let x = xy.get(0)
            let y = xy.get(1)
            let w = img.shape[0]
            let h = img.shape[1]
            // console.log("drawing at",x,y,w,h,img)
            let image = new ImageData(w,h)
            for(let i=0; i<img.shape[0]; i++) {
                for(let j=0; j<img.shape[1]; j++) {
                    let n2 = (i + j*img.shape[0]) * 4
                    image.data[n2+0] = img.get3(i,j,0)*255
                    image.data[n2+1] = img.get3(i,j,1)*255
                    image.data[n2+2] = img.get3(i,j,2)*255
                    image.data[n2+3] = 255
                }
            }
            let can = document.createElement('canvas')
            can.width = w
            can.height = h
            let ctx2 = can.getContext('2d')
            ctx2.putImageData(image,0,0)
            // console.log("final image data is",image)
            ctx.save()
            ctx.imageSmoothingEnabled = false;
            ctx.scale(this.scale,this.scale)
            ctx.drawImage(can,x,y,can.width*window.devicePixelRatio,can.height*window.devicePixelRatio)

            ctx.restore()
        }
    }
}

