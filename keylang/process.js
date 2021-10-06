import child_process from 'child_process'
import chalk from 'chalk'
import util, {promisify} from 'util'
import path from 'path'
import fs from 'fs'
import {mkdirs} from './util.js'

const SETTINGS = {
    info:false,  // brief description of what each command is doing
    exec:true,  // prints the commands as they are executed
    debug:false
}

async function compile_artlang(input, output) {
    debug('compiling artlang',input,'to',output)
}
async function copy_files(input, output) {
    debug('copying',input,'to',output)
}

const execFile = promisify(child_process.execFile)

async function doit(opts,cmd,args) {
    print_exec(opts,cmd,args)
    return await execFile(cmd,args, opts)
}
async function doit_anyway(opts,cmd,args) {
    try {
        print_exec(opts,cmd,args)
        let res = (await execFile(cmd, args, opts))
        info("returned",res)
        return res.stdout
    } catch (ex) {
        debug(ex)
        debug("CONTINUING ANYWAY")
    }
}

async function checkout_circuitpython() {
    let cwd = './circuitpython'
    let res = await doit_anyway({cwd},'git',[ 'rev-parse','--abbrev-ref','HEAD'])
    if(res.startsWith('6.3.x')) {
        debug("already have it. don't need to check it out")
    } else {
        await doit_anyway({cwd: './'}, 'git', ['clone', 'https://github.com/adafruit/circuitpython.git'])
        await doit({cwd: cwd}, 'git', ['submodule', 'sync', '--quiet', '--recursive'])
        await doit({cwd: cwd}, 'git', ['submodule', 'update', '--init'])
        await doit({cwd: cwd}, 'git', ['checkout', '6.3.x'])
    }
    await doit_anyway({cwd:cwd}, 'pip3',['install','-r','requirements-dev.txt'])
    await install_python3()
    await doit({cwd:cwd},'make',['-C','mpy-cross'])
}
async function compile_lib(file) {
    const bin = './circuitpython/mpy-cross/mpy-cross'
    let dir = path.dirname(file)
    let args = [file]
    debug("compile_lib",bin,args)
    let res = await doit({cwd:'./'},bin,args)
    debug("results are",res)
    let mpyname = path.basename(file,'.py') + '.mpy'
    return path.join(dir,mpyname)
}

async function copy_file_to_dir(lib_file, out_dir) {
    let basename = path.basename(lib_file)
    let outfile = path.join(out_dir,basename)
    debug("copy file from",lib_file, 'to', outfile)
    await fs.promises.copyFile(lib_file, outfile)
}

async function install_python3() {
    let res = await doit_anyway({cwd:'./'},'which',['python3'])
    if(res.includes('not found')) {
        debug('we must install python 3')
        //python and pip
        await doit_anyway({cwd:'./'},'brew',['install','python3'])
    }else {
        debug("skipping installing python 3. already have it")
    }
}

async function compile_mpy(input, out_dir) {
    await checkout_circuitpython()
    for(let file of input) {
        info("compiling mpy",file,'to',out_dir)
        let lib_file = await compile_lib(file)
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
    if(!SETTINGS.debug) return
    console.log(args.map(a => util.inspect(a)).map(chalk.red).join(" -- "))
}
function print_exec(opts,cmd,args) {
    if(!SETTINGS.exec) return
    console.log(chalk.bgBlue(
        chalk.blackBright(opts.cwd)
        + ' '
        + chalk.yellow.bold(cmd)
        + ' '
        + chalk.red(args.join(" "))
    ))
    // console.log(chalk.bgCyan(opts.cwd) + '  ' + chalk.bgBlue(cmd) + ' ' + chalk.bgBlueBright(args.join(" ")))
}

function info(...args) {
    if(!SETTINGS.info) return
    console.log(args.map(a => util.inspect(a)).map(chalk.yellowBright).join(" -- "))
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
