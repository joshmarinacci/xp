import fs from 'fs'

const getMethods = (obj) => {
    let properties = new Set()
    let currentObj = obj
    do {
        Object.getOwnPropertyNames(currentObj).map(item => properties.add(item))
    } while ((currentObj = Object.getPrototypeOf(currentObj)))
    return [...properties.keys()].filter(item => typeof obj[item] === 'function')
}

export function log(...args) {
    console.info(...args)
}

export async function file_to_string(src_file) {
    // log("reading from", src_file)
    let raw = await fs.promises.readFile(src_file)
    return raw.toString()
}

export async function write_to_file(path, data) {
    // log("writing to", path)
    await fs.promises.writeFile(path, data)
}

export async function copy_file(src, dst) {
    let data = await file_to_string(src)
    await write_to_file(dst, data)
}

export async function mkdirs(dir) {
    // log("making dir", dir)
    await fs.promises.mkdir(dir, {recursive: true})
}

export function checkEqual(A, B) {
    if (typeof A !== typeof B) throw new Error("different types", typeof A, "not equal", typeof B)
    // don't compare functions if they already have the same name
    if (typeof A === 'function') return true
    // console.log("testing",A,B, A===B)
    if (A === B) return true
    if (typeof A === 'object') {
        // console.log("checking", A, B)
        let a_keys = Object.getOwnPropertyNames(A)
        let b_keys = Object.getOwnPropertyNames(B)
        if (a_keys.length !== b_keys.length) throw new Error("different number of keys")
        for (let i = 0; i < a_keys.length; i++) {
            if (a_keys[i] !== b_keys[i]) throw new Error(`different keys ${a_keys[i]} != ${b_keys[i]}`)
        }
        Object.keys(A).forEach((key) => {
            // console.log('checking',key,A[key])
            // console.log('checking',B[key])
            checkEqual(A[key], B[key])
        })
        return true
    }
    if (A !== B) throw new Error(`Not equal: ${A} ${B}`)
    return true
}

export async function force_delete(tempOutDir) {
    await fs.promises.rm(tempOutDir, {recursive: true})
}
