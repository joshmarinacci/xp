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
    log("writing to", path)
    await fs.promises.writeFile(path, data)
}

export async function mkdirs(dir) {
    log("making dir", dir)
    await fs.promises.mkdir(dir, {recursive: true})
}
