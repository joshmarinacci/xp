import child_process from 'child_process'
import {promisify} from 'util'
import path from 'path'
import fs from 'fs'
import {mkdirs} from './util.js'

async function compile_artlang(input, output) {
    debug('compiling artlang',input,'to',output)
}
async function copy_files(input, output) {
    debug('copying',input,'to',output)
}

const execFile = promisify(child_process.execFile)
async function compile_lib(file) {
    const bin ="/Users/josh/projects/xp/keylang"+'/mpy-cross-macos-universal-7.0.0-108-g39886701d.app'
    let dir = path.dirname(file)
    let args = [file]
    debug("compile_lib",bin,args)
    let res = await execFile(bin, args, {
        cwd:'/Users/josh/projects/xp/keylang'
    })
    console.log("results are",res)
    let mpyname = path.basename(file,'.py') + '.mpy'
    return path.join(dir,mpyname)
}

async function copy_file_to_dir(lib_file, out_dir) {
    let basename = path.basename(lib_file)
    let outfile = path.join(out_dir,basename)
    debug("copy file from",lib_file, 'to', outfile)
    await fs.promises.copyFile(lib_file, outfile)
}

async function compile_mpy(input, out_dir) {
    debug("compiling mpy",input,'to',out_dir)
    for(let file of input) {
        let lib_file = await compile_lib(file)
        debug("lib file is",lib_file)
        await copy_file_to_dir(lib_file, out_dir)
    }
}

async function mkdir(input) {
    for(let dir of input) {
        await mkdirs(dir)
    }
}

const IN_FILE = "demo/matrix/snow.key"
const BOARD = "@matrix"
// const OUTDIR = "/Volumes/CIRCUITPY"
const OUTDIR = "./tempo"
const targets = {
    'project': {
        inputs:['@prep','@code', BOARD],
    },
    '@prep': {
        inputs:[OUTDIR],
        process:[mkdir]
    },
    '@code': {
        inputs:[IN_FILE],
        output:path.join(OUTDIR,'code.py'),
        process: [compile_artlang],
    },
    '@matrix': {
        inputs:['@prep','libs_py/tasks.py',
            'libs_py/matrix.py',
            'libs_py/common.py'],
        output:OUTDIR,
        process:[compile_mpy],
    },
}

function debug(...args) {
    console.log(...args)
}

function do_process(info) {
    debug("doing process for",info)
    if(info.process) {
        info.process.forEach(proc => {
            // console.log('calling',proc)
            proc(info.inputs.filter(i => !i.startsWith('@'))
                ,info.output)
        })
    }
}

function make_target(targets, target, opts) {
    debug("making target",target)
    let info = targets[target]
    info.inputs.forEach(input => {
        // debug("looking at input",input)
        if(input.startsWith('@')){
            make_target(targets,input,opts)
        }
    })
    if(info.process) {
        do_process(info)
    }
    // debug(info)
}

make_target(targets,'@matrix',{debug:true})
