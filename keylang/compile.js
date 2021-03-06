import {copy_file, file_to_string, mkdirs, write_to_file} from './util.js'
import fs from "fs"
import path from 'path'
import {make_grammar_semantics} from './grammar.js'
import {STD_SCOPE} from './libs_js/common.js'
import express from "express"
import {ast_to_js} from './generate_js.js'
import {ast_to_py, PyOutput} from './generate_py.js'
import {BOARDS} from './boards.js'

function strip_directives(ast) {
    let directives = ast.body.filter(c => c.type === 'directive')
    ast.body = ast.body.filter(c => c.type !== 'directive')
    return directives
}

async function compile_js(src_file,out_dir) {
    let src = await file_to_string(src_file)
    src = "\n{\n" + src + "\n}\n" //add the implicit block braces
    let generated_src_prefix = path.basename(src_file,'.key')
    let generated_src_out_name = generated_src_prefix + ".js"
    const [grammar, semantics] = await make_grammar_semantics()
    let result = grammar.match(src,'Exp')
    if(!result.succeeded()) {
        console.log(result.shortMessage)
        console.log(result.message)
        return
    }
    let ast = semantics(result).ast()
    let directives = strip_directives(ast)

    let before = []
    before.push(`import * as lib from "./common.js"`)

    let board = BOARDS.canvas
    let after = []
    directives.forEach(dir => {
        // console.log("directive",dir)
        if(dir.name.name === 'board') {
            board = BOARDS[dir.args[0].value]
        }
        if(dir.name.name === 'type') {
            if(dir.args[0].value === 'start') {
                // console.log("got a setup directive",dir)
                let name = dir.args[1].name
                after.push(`tm.register_start("${name}",${name})`)
            }
            if(dir.args[0].value === 'loop') {
                // console.log("got a loop directive")
                let name = dir.args[1].name
                after.push(`tm.register_loop("${name}",${name})`)
            }
            if(dir.args[0].value === 'event') {
                // console.log("got an event directive",dir)
                let name = dir.args[1].name
                let fun = dir.args[2].name
                after.push(`const event_wrapper = ()=> {
                    if(${name}.wasClicked()) {
                       ${fun}()
                    }
                    ${name}.clear()
                }`)
                after.push(`tm.register_event("${name}",event_wrapper)`)
            }
        }
    })

    console.log("using board",board)
    let generated_src = ast_to_js(ast).join("\n")

    let imports = Object.keys(STD_SCOPE).map(key => {
        return `const ${key} = lib.STD_SCOPE.${key}`
    }).join("\n")

    before.push(imports)
    before.push(`import {GREEN, RED, BLACK, WHITE, BLUE, GRAY, isHeadless, TaskManager, print, makeRandom} from './common.js'`)
    if(board.before) before.push(board.before)
    before.push("const tm = new TaskManager()")
    before.push(`let system = {
    startTime: new Date().getTime()/1000,
    currentTime:0
      }\n`)

    if(board.standard_cycle===true) {
        after.push(`
            tm.start()
            function do_cycle() {
                system.currentTime = new Date().getTime()/1000
                system.time = system.currentTime-system.startTime
                tm.cycle()
                setTimeout(do_cycle,100)
            }
            do_cycle()
        `)
    }
    generated_src = before.join("\n") + generated_src + after.join("\n")
    // console.log('final',generated_src)
    let outfile = path.join(out_dir, generated_src_out_name)
    console.log("writing",outfile)
    await write_to_file(outfile, generated_src)
    await web_template(src_file, out_dir, board)
}

async function prep(outdir) {
    await mkdirs(outdir)
}

async function web_template(src, out_dir, board) {
    console.log("doing html template for",board)
    let TEMPLATE_PATH = "templates/web_template.html"
    if(board.template_path) TEMPLATE_PATH = board.template_path
    console.log("using template",TEMPLATE_PATH)
    let name = path.basename(src,'.key')
    let templ = await file_to_string(TEMPLATE_PATH)
    templ = templ.replace("${LIB_SRC}","./common.js")
    templ = templ.replace("${APP_SRC}","./"+name+".js")
    templ = templ.replace("${RELOAD}","./reload.js")
    await write_to_file(path.join(out_dir, name+".html"), templ)
}

async function copy_js_libs(out_dir) {
    await copy_file("./libs_js/common.js",path.join(out_dir,'common.js'))
    await copy_file("./libs_js/canvas.js",path.join(out_dir,'canvas.js'))
    await copy_file("./libs_js/matrixportal.js",path.join(out_dir,'matrixportal.js'))
    await copy_file("./libs_js/trellis.js",path.join(out_dir,'trellis.js'))
    await copy_file("./libs_js/thumby.js",path.join(out_dir,'thumby.js'))
    await copy_file("./libs_js/trinkey.js",path.join(out_dir,'trinkey.js'))
    await copy_file("./reload.js",path.join(out_dir,'reload.js'))
}

async function start_webserver(src,outdir) {
    let basename = path.basename(src,'.key')
    let watchfile = path.join(outdir,basename+".js")
    const PORT = 8080
    let app = express()
    app.use('/',express.static('build'))
    console.log('watching for changes in the webserver',watchfile)
    app.get("/lastmod.json",async (req,res)=>{
        let stats = await fs.promises.stat(watchfile)
        res.send({"mod":stats.mtime})
    })
    await app.listen(PORT,()=>{
        console.log(`app listening at http://localhost:${PORT}/${basename}.html`)
    })
    console.log("webserver started")
}

async function start_filewatcher(src,outdir, cb) {
    try {
        console.log("watching",src)
        let base = path.basename(src)
        const watcher = fs.promises.watch(src);
        for await (const event of watcher) {
            console.log(event);
            if(event.eventType === 'change' && event.filename === base) {
                console.log("we need to recompile the page")
                await cb()
                console.log("recompiled",src)
            }
        }
    } catch (err) {
        if (err.name === 'AbortError')
            return;
        throw err;
    }

    // await compile(src,outdir)
}

export async function compile_py(opts) {
    let src_path = opts.src
    let outdir = opts.outdir
    console.log("processing",src_path,'to python dir',outdir)
    let src = await file_to_string(src_path)
    src = "\n{\n" + src + "\n}\n" //add the implicit block braces
    let generated_src_prefix = path.basename(src_path,'.key')
    let generated_src_out_name = generated_src_prefix + ".py"
    if(opts.outfile) generated_src_out_name = opts.outfile
    const [grammar, semantics] = await make_grammar_semantics()
    let result = grammar.match(src,'Exp')
    if(!result.succeeded()) {
        console.log(result.shortMessage)
        console.log(result.message)
        return
    }
    let board = null
    let ast = semantics(result).ast()
    let directives = strip_directives(ast)
    directives.forEach(dir => {
        // console.log(dir)
        if(dir.name.name === 'board') {
            board = BOARDS[dir.args[0].value]
        }

    })
    console.log("board",board)
    // console.log("ast is",ast)
    let out = new PyOutput()
    ast_to_py(ast,out)
    // console.log("end result is",out)
    let generated_src = out.generate()
    let TEMPLATE_PATH = "circuitpython_template.py"
    if(board.python.template_path) TEMPLATE_PATH = board.python.template_path
    console.log("using template path", TEMPLATE_PATH)
    let template = await file_to_string(TEMPLATE_PATH)
    template = template.replace("${BOARD_IMPORTS}",board.python.imports)
    template = template.replace("${USER_VARIABLES}","")
    let after = []
    directives.forEach(dir => {
        // console.log("dirs",dir)
        if (dir.name.name === 'type') {
            if (dir.args[0].value === 'start') {
                // console.log("got a setup directive",dir)
                let name = dir.args[1].name
                after.push(`tm.register_start("${name}",${name})`)
            }
            if (dir.args[0].value === 'loop') {
                // console.log("got a loop directive")
                let name = dir.args[1].name
                after.push(`tm.register_loop("${name}",${name})`)
            }
            if (dir.args[0].value === 'event') {
                // console.log("got an event directive",dir)
                let name = dir.args[1].name
                let fun = dir.args[2].name
                after.push(`const event_wrapper = ()=> {
                    if(${name}.wasClicked()) {
                       ${fun}()
                    }
                    ${name}.clear()
                }`)
                after.push(`tm.register_event("${name}",event_wrapper)`)
            }
        }
    })

    template = template.replace("${USER_FUNCTIONS}",generated_src + '\n' + after.join("\n"))


    let outfile = path.join(outdir, generated_src_out_name)
    console.log(`writing ${outfile}`)
    await write_to_file(outfile, template)

    console.log('doing libs for board',board.python.libs)
    for(let name of board.python.libs) {
        await copy_file(`libs_py/${name}.py`,path.join(outdir,`${name}.py`))
        console.log("doing library",name)
    }

    // let CP_ROOT = "/Users/josh/Desktop/Hardware\ Hacking/MatrixPortal/adafruit-circuitpython-bundle-6.x-mpy-20210903"
    // let src_lib = path.join(CP_ROOT,'lib','neopixel.mpy')
    // let dst_lib = path.join(outdir,'lib/neopixel.mpy')
    // console.log('copying',src_lib,'to',dst_lib)
    // await copy_file(src_lib,dst_lib)
}

async function copy_py_libs(outdir) {
    // await copy_file("libs_py/tasks.py",path.join(outdir,'tasks.py'))
    // await copy_file("libs_py/common.py",path.join(outdir,'common.py'))
    // await copy_file("libs_py/matrix.py",path.join(outdir,'matrix.py'))
}

export async function build(opts) {
    await prep(opts.outdir)
    if(opts.target === 'js') {
        if (opts.browser) await start_webserver(opts.src, opts.outdir)
        await compile_js(opts.src, opts.outdir)
        await copy_js_libs(opts.outdir)
        if (opts.browser) await start_filewatcher(opts.src, opts.outdir,async ()=>{
            await compile_js(opts.src,opts.outdir)
        })
    }
    if(opts.target === 'py') {
        await compile_py(opts)
        await copy_py_libs(opts.outdir)
        if (opts.watch) await start_filewatcher(opts.src, opts.outdir, async () => {
            await compile_py(opts)
        })
    }
}

