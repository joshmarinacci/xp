export function range(v1,v2) {
    if(typeof v2 === 'undefined') {
        return range(0,v1)
    } else {
        let arr = new Array()
        for(let i=v1; i<v2; i++) {
            arr.push(i)
        }
        return arr
    }
}
export function remap(val, min, max, MIN, MAX) {
    let t = (val - min) / (max - min)
    return ((MAX - MIN) * t) + MIN
}
export function lerp(t, min, max) {
    return ((max - min) * t) + min
}
export function randi(min, max) {
    return Math.floor(remap(Math.random(),0,1,min,max))
}
export function randf(min, max) {
    return remap(Math.random(),0,1,min,max)
}

