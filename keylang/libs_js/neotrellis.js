import {isBrowser, KColor, KList} from './common.js'

export const board = {
    SWITCH:"SWITCH",
}


export class Trellis {
    constructor(w,h) {
        this.w = w
        this.h = h
        console.log("made a trellis of",w,h)
        this.state = new Array(this.w*this.h)
        this.state.fill(0)
        this.just_pressed = []
        this.just_released = []
        this.mouse_down = (e) => {
            let coords = this.event_to_coords(e)
            this.just_pressed.push(coords)
        }
        this.mouse_up = (e) => {
            let coords = this.event_to_coords(e)
            this.just_released.push(coords)
        }
        if(isBrowser()) {
            this.wrapper = document.createElement('div')
            this.wrapper.classList.add('trellis-wrapper')
            let len = this.w * this.h
            this.buttons = []
            for(let i=0; i<len; i++) {
                let div = document.createElement('div')
                div.classList.add("button")
                div.setAttribute('data-n',i)
                div.addEventListener('mousedown',this.mouse_down)
                div.addEventListener('mouseup',this.mouse_up)
                this.wrapper.append(div)
                this.buttons.push(div)
            }
            document.body.append(this.wrapper)
        }
        this.set([0,0],new KColor(1,0,0))
        this.set([3,3],new KColor(1,0,1))
    }
    fill(color) {
        this.state.fill(color)
        for(let j=0; j<this.h; j++) {
            for (let i = 0; i < this.w; i++) {
                this.set([i,j],color)
            }
        }
    }
    set(coords, color) {
        if(coords instanceof KList) coords = coords.data
        let n = coords[0] + coords[1]*this.w
        this.buttons[n].style.backgroundColor = color.toCSSColor()
    }
    cycle() {
        this.just_pressed = []
        this.just_released = []
    }

    event_to_coords(e) {
        let n = e.target.getAttribute('data-n')
        let x = n % this.w
        let y = Math.floor(n/this.w)
        return [x,y]
    }
}
