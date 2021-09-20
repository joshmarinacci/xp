export const board = {
    SWITCH:"SWITCH",
}


class _LEDButton {
    constructor(id) {
        console.log("DOM LED button")
        this.id = id
        this.elem = document.createElement('button')
        this.elem.id = "button_"+id
        this.elem.innerText = `button ${id}`
        this.elem.classList.add("ledbutton")
        document.body.append(this.elem)
        this.clicked = false
        this.elem.addEventListener('click',() => {
            this.clicked = true
        })
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

const SINGLE_BUTTOn = new _LEDButton("")

const color_to_css = (col) => `rgb(${col[0]*255},${col[1]*255},${col[2]*255})`

export function Button(id) {
    return SINGLE_BUTTOn
}
export function NeoPixel(id) {
    return SINGLE_BUTTOn
}
export function print(...args) {
    console.log(...args)
}

export const WHITE = [1,1,1]
export const GREEN = [0,1,0]
export const BLACK = [0,0,0]
export const RED   = [1,0,0]
export function _NOW() {
    return new Date().getTime()
}

export class TaskManager {
    constructor() {
        this.tasks = []
    }
    register_start(name,fun) {
        this.register_task('start',name,fun)
    }
    register_loop(name,fun) {
        this.register_task('loop',name,fun)
    }
    register_event(name,fun) {
        this.register_task('event',name,fun)
    }

    register_task(type, name, fun) {
        this.tasks.push({
            name:'name',
            type:type,
            fun:fun,
            start:_NOW(),
            delay:0,
        })
    }

    start() {
        print("starting the task master")
        this.tasks.filter(t => t.type === 'start').forEach(task => {
            task.fun()
        })
    }
    cycle() {
        // print("task master cycling")
        this.tasks.filter(t => t.type === 'event').forEach(task => task.fun())
        this.tasks.filter(t => t.type === 'loop').forEach(task => task.fun())
        this.tasks.filter(t => t.type === 'mode').forEach(task => task.fun())
    }
}

