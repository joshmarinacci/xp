function compile_artlang(input, output) {
    debug('compiling artlang',input,'to',output)
}
function copy_files(input, output) {
    debug('copying',input,'to',output)
}
function compile_mpy(input, output) {
    debug("compiling mpy",input,'to',output)
}

const targets = {
    'project': {
        inputs:['@code', '@matrix'],
    },
    '@code': {
        inputs:['demo/matrix/snow.key'],
        output:'/Volumes/CIRCUITPY/code.py',
        process: [compile_artlang],
    },
    '@matrix': {
        inputs:['py_libs/tasks.py',
            'py_libs/matrix.py',
            'py_libs/common.py'],
        output:'/Volumes/CIRCUITPY/',
        process:[compile_mpy, copy_files],
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
            proc(info.inputs,info.output)
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

make_target(targets,'project',{debug:true})
