export function isHeadless() {
    if(typeof process !== 'undefined' && process.env && process.env.ARTLANG_HEADLESS) return true
    return false
}
export function isBrowser() {
    return !isHeadless()
}

export function print(...args) {
    console.log(...args)
}

export function _NOW() {
    return new Date().getTime()
}

export function zip(A, B) {
    let i = 0
    let out = new KList()
    while(true) {
        if(i >= A.length) break
        if(i >= B.length) break
        let a  = A.get(i)
        let b  = B.get(i)
        out.push(new KList(a,b))
        i += 1
    }
    // console.log("zip produced",JSON.stringify(out,null,'  '))
    return out
}
export function zipWith(A,B,binop) {
    return zip(A, B).map((tuple) => binop(tuple.get(0), tuple.get(1)))
}

export function makeZipWith(binop) {
    return function(A,B) {
        return zipWith(A,B,binop)
    }
}

const undef = (A) => typeof A === 'undefined'

export function makeBinOp(binop) {
    return function(A,B) {
        if(undef(A) || undef(B) ) throw new Error("cannot do operationg on undefined variable")
        if(A.data && B.data) return zipWith(A,B,binop)
        if(A.data && !B.data) return A.map(a => binop(a,B))
        if(!A.data && B.data) return B.map(b => binop(A,b))
        return binop(A,B)
    }

}

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
        this.set = (index, value) => this.data[index] = value
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
    push(v) {
        return this.data.push(v)
    }
    flatten() {
        let arr = []
        this.data.forEach(el => {
            if(el.data) {
                let data = el.flatten()
                data.forEach(d=>{
                    arr.push(d)
                })
            } else {
                arr.push(el)
            }
        })
        return new KList(arr)
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
export class KeyColor {
    constructor(args) {
        this.red = 0
        this.green = 0
        this.blue = 0
        if(args.hasOwnProperty('red')) this.red = args.red
        if(args.hasOwnProperty('r')) this.red = args.r
        if(args.hasOwnProperty('green')) this.green = args.green
        if(hasProp(args,'g')) this.green = args.g
        if(args.hasOwnProperty('blue')) this.blue = args.blue
        if(hasProp(args,'b')) this.blue = args.b
        if(args.hasOwnProperty('gray')) {
            this.red = args.gray
            this.green =  args.gray
            this.blue = args.gray
        }
        if(args.hasOwnProperty('hue')) {
            let hue = args.hue
            let sat = args.sat
            let lit = args.lit
            let [red,green,blue] = hslToRgb(hue,sat,lit)
            this.red = red
            this.green = green
            this.blue = blue
        }
    }
    toCSSColor() {
        return `rgb(${Math.floor(this.red*255)}, ${Math.floor(this.green*255)},${Math.floor(this.blue*255)})`
    }
}

export const BLACK = new KColor(0,0,0)
export const BLUE  = new KColor(0,0,1)
export const RED   = new KColor(1,0,0)
export const GREEN = new KColor(0,1,0)
export const WHITE = new KColor(1,1,1)
export const PI = Math.PI

export class KObj {
    constructor() {
    }
}
export class KPoint extends KList {
    constructor(x,y) {
        super(x,y)
    }
}
export class KVector extends KList{
    constructor(x,y) {
        super(x,y)
    }
}
export class KRect {
    constructor(x,y,w,h) {
        if(typeof x === 'object') {
            let opts = x
            this.x = opts.x || 0
            this.y = opts.y || 0
            this._w = opts.w || 10
            this._h = opts.h || 10
        } else {
            this.x = x
            this.y = y
            this._w = w
            this._h = h
        }
    }
    get x1() {
        return this.x
    }
    get x2() {
        return this.x + this._w
    }
    get y1() {
        return this.y
    }
    get y2() {
        return this.y + this._h
    }
    get w() {
        return this._w
    }
    get h() {
        return this._h
    }
    get size() {
        return new KPoint(this._w,this._h)
    }
    get left() {
        return this.x
    }
    get right() {
        return this.x + this._w
    }
    get top() {
        return this.y
    }
    get bottom() {
        return this.y2
    }
    split(dir,amount) {
        if (dir === 'h') return new KList(
            new KRect({
                x:this.x1,
                y:this.y1,
                w:lerp(amount, this.x1, this.x2),
                h:this.y2
            }),
            new KRect({
                x:lerp(amount, this.x1, this.x2), y:this.y1,
            w:this.x2, h:this.y2,
            })
        )
        if (dir === 'v') return new KList(
            new KRect({
                x:this.x1, y:this.y1,
                w:this.x2, h:lerp(amount, this.y1, this.y2)}),
            new KRect({
                x:this.x1, y:lerp(amount, this.y1, this.y2),
                w:this.x2, h:this.y2})
        )
    }
}

function hasProp(args,name) {
    return args.hasOwnProperty(name)
}

export class KCircle{
    constructor(args) {
        if(hasProp(args,'x')) this.x = args.x
        if(hasProp(args,'y')) this.y = args.y
        if(hasProp(args,'r')) this.r = args.r
        if(hasProp(args,'radius')) this.r = args.radius
    }
    get center() {
        return new KPoint(this.x,this.y)
    }
    set center(kp) {
        this.x = kp.data[0]
        this.y = kp.data[1]
    }
    get radius() {
        return this.r
    }
}


export const add = makeBinOp((a,b)=>a+b)
export const subtract = makeBinOp((a,b)=>a-b)
export const multiply = makeBinOp((a,b)=>a*b)
export const divide = makeBinOp((a,b)=>a/b)
export const lessthan = makeBinOp((a,b)=>a<b)
export const greaterthan = makeBinOp((a,b)=>a>b)
export const lessthanorequal = makeBinOp((a,b)=>a<=b)
export const greaterthanorequal = makeBinOp((a,b)=>a>=b)
export const equal = makeBinOp((a,b)=>a===b)
export const not   = (a) => !a


function xmur3(str) {
    for(var i = 0, h = 1779033703 ^ str.length; i < str.length; i++)
        h = Math.imul(h ^ str.charCodeAt(i), 3432918353),
            h = h << 13 | h >>> 19;
    return function() {
        h = Math.imul(h ^ h >>> 16, 2246822507);
        h = Math.imul(h ^ h >>> 13, 3266489909);
        return (h ^= h >>> 16) >>> 0;
    }
}

function sfc32(a, b, c, d) {
    return function() {
        a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
        var t = (a + b) | 0;
        a = b ^ b >>> 9;
        b = c + (c << 3) | 0;
        c = (c << 21 | c >>> 11);
        d = d + 1 | 0;
        t = t + d | 0;
        c = c + t | 0;
        return (t >>> 0) / 4294967296;
    }
}

export class RandomNumberGenerator {
    constructor(seed_str) {
        let seed = xmur3(seed_str)
        this.randfun = sfc32(seed(), seed(), seed(), seed());
    }
    random() {
        return this.randfun()
    }
}
export function makeRandom(seed_str) {
    if(!seed_str) seed_str = "artlang"
    return new RandomNumberGenerator(seed_str)
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
export function range(min,max,step) {
    if(typeof max === 'undefined') return range(0,min,1)
    if(typeof step === 'undefined') step = 1
    let arr = []
    for(let i=min; i<max; i=i+step) {
        arr.push(i)
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
export function lerp(t,min,max) {
    return ((max - min) * t) + min
}
export function remap(val, min, max, MIN, MAX) {
    let t = (val - min) / (max - min)
    return ((MAX - MIN) * t) + MIN
}

export function sleep(dur) {
    return new Promise((res,rej)=>{
        setTimeout(()=>{
            res()
        },Math.floor(dur*1000))
    })
}

/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   {number}  h       The hue
 * @param   {number}  s       The saturation
 * @param   {number}  l       The lightness
 * @return  {Array}           The RGB representation
 */
function hslToRgb(h, s, l){
    var r, g, b;

    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        var hue2rgb = function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [r,g,b]//, Math.round(g * 255), Math.round(b * 255)];
}

export function HSL(h,s,v) {
    let rgb8 = hslToRgb(h,s,v)
    return new KColor(rgb8[0]/255,rgb8[1]/255,rgb8[2]/255)
}
export const STD_SCOPE = {
    List:(...args)=> new KList(...args),
    getPart:(obj,name) => obj[name],
    range,
    add,
    subtract,
    divide,
    multiply,
    lessthan,
    greaterthan,
    equal,
    not,
    randi,
    randf,
    choose,
    wrap,
    lerp,
    remap,
    floor:Math.floor,
    sleep,
    sine1: (v) => remap(Math.sin(v), -1, 1, 0,1),
    HSL:HSL,
    Color:(...args) => new KColor(...args),
    KeyColor:(...args) => new KeyColor(...args),
    Canvas:(...args) => new KCanvas(...args),
    Obj:(...args) => new KObj(...args),
    Point:(...args) => new KPoint(...args),
    Vector:(...args) => new KVector(...args),
    Rect:(...args) => new KRect(...args),
    Circle:(...args) => new KCircle(...args),
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
            name:name,
            type:type,
            fun:fun,
            start:_NOW(),
            delay:0,
            pending:false,
        })
    }

    _run_task(task) {
        // console.log("task is",task.name)
        if(task.pending) {
            // console.log(`${task.name} already running`)
            return
        }
        // console.log(`starting ${task.name}`)
        task.pending = true
        let prom = task.fun()
        if(!prom) console.error("task did not return a promise!")
        prom.then(() => {
            // console.log("task",task.name,'ended')
            task.pending = false
        })
    }

    start() {
        print("starting the task master")
        this.tasks.filter(t => t.type === 'start').forEach(this._run_task)
    }
    cycle() {
        // print("task master cycling")
        this.tasks.filter(t => t.type === 'event').forEach(this._run_task)
        this.tasks.filter(t => t.type === 'loop').forEach(this._run_task)
        this.tasks.filter(t => t.type === 'mode').forEach(this._run_task)
    }
}
