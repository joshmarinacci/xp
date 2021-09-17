export class KList {
    constructor(...args) {
        this.data = []
        args.forEach(arg => {
            if(Array.isArray(arg)) {
                this.data.push(...arg)
            } else {
                this.data.push(arg)
            }
        })
        this.get = (index)=>this.data[index]
    }
    get length() {
        return this.data.length
    }
    // get(index) {
    //     console.log(`KList.get(${index})`)
    //     return this.data[index]
    // }
    map(cb) {
        return new KList(this.data.map(cb))
    }
    forEach(cb) {
        // console.log("calling for each on",this.data)
        this.data.forEach(cb)
    }
    every(cb) {
        return this.forEach(cb)
    }
}

export class KCanvas {
    constructor(x,y,w,h,selector) {
        this.x = x
        this.y = y
        this.w = w
        this.h = h
        this.scale = 10
        if(selector) this.canvas = document.querySelector(selector)
    }
    get width() {
        return this.w
    }
    get size() {
        return [this.w,this.h]
    }
    setPixel(xy,color) {
        let ctx = this.canvas.getContext('2d')
        let x = xy.get(0)
        let y = xy.get(1)
        // console.log("drawing at",x,y,color)
        ctx.fillStyle = color.toCSSColor()
        // console.log("fillstyle is",color.toCSSColor())
        ctx.fillRect(
            Math.floor(x)*this.scale,
            Math.floor(y)*this.scale,
            this.scale,
            this.scale,
        )
    }

    clear() {
        let ctx = this.canvas.getContext('2d')
        ctx.fillStyle = 'black'
        ctx.fillRect(0,0,this.canvas.width,this.canvas.height)
    }
}

export class KColor {
    constructor(r,g,b) {
        this.r = r
        this.g = g
        this.b = b
    }
    toCSSColor() {
        return `rgb(${Math.floor(this.r*255)}, ${Math.floor(this.g*255)},${Math.floor(this.b*255)})`
    }
}
export class KObj {
    constructor() {
    }
}
export class KPoint {
    constructor(x,y) {
        this.data = [x,y]
    }
}
export class KVector {
    constructor(x,y) {
        this.data = [x,y]
    }
}
export class KRect {
    constructor(x,y,w,h) {
        if(typeof x === 'object') {
            let opts = x
            this.x = opts.x || 0
            this.y = opts.y || 0
            this.w = opts.w || 0
            this.h = opts.h || 0
        } else {
            this.x = x
            this.y = y
            this.w = w
            this.h = h
        }
    }
}

export function add(a,b) {
    if(a.data && b.data) {
        let new_data = a.data.map((aa,i) => {
            return aa + b.data[i]
        })
        return new KList(new_data)
    }
    return a + b
}
export function choose(list) {
    let n = Math.floor(Math.random()*list.length)
    return list.get(n)
}
export function randi(min,max) {
    if(typeof max === 'undefined') return randi(0,min)
    return Math.floor(Math.random()*(max-min) + min)
}
export function randf(min,max) {
    if(typeof max === 'undefined')  return randf(0,min)
    return Math.random()*(max-min) + min
}
export function range(...args) {
    let arr = []
    for(let i=0; i<args[0]; i++) {
        arr[i]= i
    }
    return new KList(arr)
}
export function wait(time) {
    // console.log('waiting for time',time)
}

function get_at(arr,i) {
    if(arr.data) return arr.get(i)
    return arr[i]
}
function triple_map(a,b,c,cb) {
    let res = []
    for(let i=0; i<a.length; i++) {
        let aa = get_at(a,i)
        let bb = get_at(b,i)
        let cc = get_at(c,i)
        res.push(cb(aa,bb,cc))
    }
    return new KList(res)
}

export function wrap(val, min, max) {
    // console.log('wrapping',val,'between',min,'and',max)
    if(val.data ) {
        // console.log("wrapping a list")
        return triple_map(val,min,max,(a,b,c)=>{
            return wrap(a,b,c)
        })
        // return new KList([
        //     wrap(val.get(0),min.get(0),max.get(0)),
        //     wrap(val.get(1),min.get(1),max.get(1))
        // ])
    }
    if(val < min) return val + (max-min)
    if(val > max) return val - (max-min)
    return val
}
export const STD_SCOPE = {
    List:(...args)=>{
        // console.log("got the args",...args)
        return new KList(...args)
    },
    getPart:(obj,name) => {
        // let proto = Object.getPrototypeOf(obj)
        // console.log("obj",obj,'name',name)
        // console.log("proto is",proto)
        // console.log("proto names",Object.getOwnPropertyNames(proto))
        // console.log("trying index",obj['get'])
        // console.log('get part returning',name,'from',obj,
        //     Object.getPrototypeOf(obj)[name])
        // console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(obj)))
        // console.log("methods",getMethods(obj))
        return obj[name]
    },
    range:(...args)=> {
        let arr = []
        for(let i=0; i<args[0]; i++) {
            arr[i]= i
        }
        let list = new KList(arr)
        // console.log('testing the list',list.get(1))
        return list
    },
    add:add,
    Color:(...args) => new KColor(...args),
    Canvas:(...args) => new KCanvas(...args),
    Obj:(...args) => new KObj(...args),
    Point:(...args) => new KPoint(...args),
    Vector:(...args) => new KVector(...args),
    Rect:(...args) => new KRect(...args),

}
