import {isBrowser} from './common.js'

export const board = {
    SWITCH:"SWITCH",
}


class _LEDButton {
    constructor(id) {
        console.log("DOM LED button")
        this.id = id
        this.clicked = false
        if(isBrowser()) {
            this.elem = document.createElement('button')
            this.elem.id = "button_" + id
            this.elem.innerText = `button ${id}`
            this.elem.classList.add("ledbutton")
            document.body.append(this.elem)
            this.elem.addEventListener('click', () => {
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

const SINGLE_BUTTON = new _LEDButton("")

const color_to_css = (col) => `rgb(${col[0]*255},${col[1]*255},${col[2]*255})`

export function Button(id) {
    return SINGLE_BUTTON
}
export function NeoPixel(id) {
    return SINGLE_BUTTON
}


