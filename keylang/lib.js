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

export const BLACK = new KColor(0,0,0)
export const BLUE  = new KColor(0,0,1)
export const RED   = new KColor(1,0,0)
export const GREEN = new KColor(0,1,0)
export const WHITE = new KColor(1,1,1)

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
            this.w = opts.w || 0
            this.h = opts.h || 0
        } else {
            this.x = x
            this.y = y
            this.w = w
            this.h = h
        }
    }
    get x1() {
        return this.x
    }
    get x2() {
        return this.x + this.w
    }
    get y1() {
        return this.y
    }
    get y2() {
        return this.y + this.h
    }
    split(dir,amount) {
        if (dir === 'h') return new KList(
            new KRect(
                this.x1, this.y1,
                lerp(amount, this.x1, this.x2), this.y2,),
            new KRect(
                lerp(amount, this.x1, this.x2), this.y1,
                this.x2, this.y2,
            )
        )
        if (dir === 'v') return new KList(
            new KRect(
                this.x1, this.y1,
                this.x2, lerp(amount, this.y1, this.y2)),
            new KRect(
                this.x1, lerp(amount, this.y1, this.y2),
                this.x2, this.y2)
        )
    }
}
export class KCanvas extends KRect {
    constructor(x,y,w,h) {
        super(x,y,w,h)
        this.scale = 10
        this.canvas = document.createElement('canvas')
        this.canvas.width = this.w*this.scale
        this.canvas.height = this.h*this.scale
        document.body.append(this.canvas)
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
    fillRect(rect,color) {
        // console.log("filling",rect,color)
        let ctx = this.canvas.getContext('2d')
        ctx.fillStyle = color.toCSSColor()
        let xx = Math.floor(rect.x)*this.scale
        let ww = Math.floor(rect.w)*this.scale
        let yy = Math.floor(rect.y)*this.scale
        let hh = Math.floor(rect.h)*this.scale

        // console.log("filling",xx,yy,ww,hh, color.toCSSColor())
        ctx.fillRect(
            xx,
            yy,
            ww,
            hh,
        )
    }
    strokeRect(rect,color) {
        let ctx = this.canvas.getContext('2d')
        ctx.fillStyle = color.toCSSColor()
        // console.log("stroking",rect,color)
        let xx = Math.floor(rect.x)*this.scale
        let ww = Math.floor(rect.w)*this.scale
        let yy = Math.floor(rect.y)*this.scale
        let hh = Math.floor(rect.h)*this.scale

        // console.log("filling",xx,yy,ww,hh, color.toCSSColor())
        ctx.fillRect(xx,yy,ww,this.scale)
        ctx.fillRect(xx,yy+hh-this.scale,ww,this.scale)
        ctx.fillRect(xx,yy,this.scale,hh)
        ctx.fillRect(xx+ww-this.scale,yy,this.scale,hh)
    }

    clear() {
        let ctx = this.canvas.getContext('2d')
        ctx.fillStyle = 'black'
        ctx.fillRect(0,0,this.canvas.width,this.canvas.height)
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

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

export function HSL(h,s,v) {
    let rgb8 = hslToRgb(h,s,v)
    return new KColor(rgb8[0]/255,rgb8[1]/255,rgb8[2]/255)
}
export const STD_SCOPE = {
    List:(...args)=> new KList(...args),
    getPart:(obj,name) => obj[name],
    range:(...args)=> {
        let arr = []
        for(let i=0; i<args[0]; i++) {
            arr[i]= i
        }
        return new KList(arr)
    },
    add,
    subtract,
    divide,
    multiply,
    lessthan,
    equal,
    not,
    randi,
    randf,
    choose,
    wrap,
    lerp,
    remap,
    sleep,
    HSL:HSL,
    Color:(...args) => new KColor(...args),
    Canvas:(...args) => new KCanvas(...args),
    Obj:(...args) => new KObj(...args),
    Point:(...args) => new KPoint(...args),
    Vector:(...args) => new KVector(...args),
    Rect:(...args) => new KRect(...args),
}
