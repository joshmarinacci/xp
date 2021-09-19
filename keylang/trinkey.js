export const board = {

}

export function Button(id) {
    console.log("making a fake button")
}
export function set_led(color) {
    console.log("pretending to set an led color",color)
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
        console.log("registering the start task",name,fun)
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
        // this.tasks.filter(t => t.type === 'event').forEach(task => task.fun())
        this.tasks.filter(t => t.type === 'loop').forEach(task => task.fun())
        this.tasks.filter(t => t.type === 'mode').forEach(task => task.fun())
    }
}

