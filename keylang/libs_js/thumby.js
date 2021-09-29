import {isBrowser, KRect} from './common.js'

console.log("initting thumby support")

export const board = {
    A_BUTTON:"#abut",
    B_BUTTON:"#bbut",
    D_PAD:"#dpad .dpad",
}

export class ThumbyCanvas extends KRect {
    constructor(w,h) {
        super(0,0,w,h)
        console.log("making thumby canvas")
        this.scale = 1
        if(isBrowser()) {
            this.scale = 10
            this.canvas = document.querySelector('#canvas')
            // this.canvas = document.createElement('canvas')
            this.canvas.classList.add("thumby-wrapper")
            this.canvas.width = this.w*this.scale
            this.canvas.height = this.h*this.scale
            this.canvas.style.width = `${this.w*this.scale/window.devicePixelRatio}px`
            this.canvas.style.height = `${this.h*this.scale/window.devicePixelRatio}px`
            // document.body.append(this.canvas)
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
        console.log("filling",rect,color)
        let ctx = this.canvas.getContext('2d')
        ctx.fillStyle = color.toCSSColor()
        ctx.fillRect(rect.x*this.scale,rect.y*this.scale,rect.w*this.scale,rect.h*this.scale)
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
            let pt = line.get(i)
            if(i === 0) {
                ctx.moveTo(pt.get(0),pt.get(1))
            } else {
                ctx.lineTo(pt.get(0),pt.get(1))
            }
        }
        ctx.stroke()
        ctx.restore()
    }
}

class ABButton {
    constructor(id) {
        console.log("AB button",id)
        this.id = id
        this.clicked = false
        if(isBrowser()) {
            this.elem = document.querySelector(id)
            this.elem.addEventListener('click', (e) => {
                console.log("clicked the button",e.target.id)
                this.clicked = true
            })
        }
    }
    wasClicked() {
        return this.clicked
    }
    clear() {
        this.clicked = false
    }
    fill(col) {
        return this.color(col)
    }
    color(col) {
        this.elem.style.backgroundColor = color_to_css(col)
    }
}

class DPadControl {
    constructor(id) {
        console.log("AB button")
        this.id = id
        this.clicked = false
        if(isBrowser()) {
            this.buttons  = document.querySelectorAll(id)
            console.log("got the buttons",this.buttons,id)
            this.buttons.forEach(bt => {
                bt.addEventListener('click',(e) => {
                    console.log("clicked the dpad button",e.target.id)
                })
            })
            // this.elem.id = "button_" + id
            // this.elem.innerText = `button ${id}`
            // this.elem.classList.add("ledbutton")
            // document.body.append(this.elem)
            // this.elem.addEventListener('click', () => {
            //     this.clicked = true
            // })
        }
    }
    wasClicked() {
        return this.clicked
    }
    clear() {
        this.clicked = false
    }
    fill(col) {
        return this.color(col)
    }
    color(col) {
        this.elem.style.backgroundColor = color_to_css(col)
    }
}

export function Button(id) {
    return new ABButton(id)
}
export function DPad(id) {
    return new DPadControl(id)
}
