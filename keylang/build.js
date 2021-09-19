/*

- [ ] make test_led_button.key to setup a button and blink and change colors on button
- [ ] create separate lib.py
- [ ] choose out dir so you can go to /Volumes/CIRCUITPY

 */
import {copy_file, file_to_string, mkdirs, write_to_file} from './util.js'
import fs from "fs"
import path from 'path'
import {ast_to_js, ast_to_py, make_grammar_semantics, PyOutput} from './grammar.js'
import {STD_SCOPE} from './lib.js'
import express from "express"

function error_and_exit(str) {
    console.error(str)
    process.exit(-1)
}

function process_options(argv,defs) {
    argv = argv.slice(2)
    for(let i=0; i<argv.length; i++) {
        // console.log(argv[i])
        if(argv[i] === '--src') {
            i++
            defs.src = argv[i]
        }
        if(argv[i] === '--watch')  defs.watch = true
        if(argv[i] === '--browser')  defs.browser = true
        if(argv[i] === '--target') {
            i++
            defs.target = argv[i]
        }
        if(argv[i] === '--outdir') {
            i++
            defs.outdir = argv[i]
        }
        if(argv[i] === '--outfile') {
            i++
            defs.outfile = argv[i]
        }
    }
    return defs
}

let opts = process_options(process.argv,{
    src:null,
    watch:false,
    browser:false,
    outdir:"build",
    target:null,
    outfile:null,
})
// console.log("final opts",opts)

if(!opts.src) error_and_exit("!! missing input file")
if(!opts.target) error_and_exit("target output language must be specified. js or py")


async function compile_js(src_file,out_dir) {
        let src = await file_to_string(src_file)
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
        let generated_src = ast_to_js(ast).join("\n")

    let imports = Object.keys(STD_SCOPE).map(key => {
        return `const ${key} = lib.STD_SCOPE.${key}`
    }).join("\n")

        let prelude = `
import * as lib from "./lib.js"
${imports}
import {KCanvas} from "./lib.js"
let screen = new KCanvas(0,0,64,32,"#canvas")
let system = {
    time:0
}
`

        let postlude = `
setup()
function do_cycle() {
    screen.clear()
    system.time = Date.now()
    loop()
    setTimeout(do_cycle,100)
}
do_cycle()
`
        generated_src = prelude + generated_src + postlude
        await write_to_file(path.join(out_dir, generated_src_out_name), generated_src)
}

async function prep(outdir) {
    await mkdirs(outdir)
}

async function web_template(src, out_dir) {
    let TEMPLATE_PATH = "web_template.html"
    let name = path.basename(src,'.key')
    let templ = await file_to_string(TEMPLATE_PATH)
    templ = templ.replace("${LIB_SRC}","./lib.js")
    templ = templ.replace("${APP_SRC}","./"+name+".js")
    templ = templ.replace("${RELOAD}","./reload.js")
    await write_to_file(path.join(out_dir, name+".html"), templ)
}


async function copy_js_libs(out_dir) {
    await copy_file("./lib.js",path.join(out_dir,'lib.js'))
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

async function start_filewatcher(src,outdir) {
    try {
        console.log("watching",src)
        const watcher = fs.promises.watch(src);
        for await (const event of watcher) {
            console.log(event);
            if(event.eventType === 'change' && event.filename === src) {
                console.log("we need to recompile the page")
                await compile_js(src,outdir)
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

async function compile_py(opts) {
    let src_path = opts.src
    let out_dir = opts.outdir
    console.log("processing",src_path,'to python')
    let src = await file_to_string(src_path)
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
    let ast = semantics(result).ast()
    // console.log("ast is",ast)
    let out = new PyOutput()
    ast_to_py(ast,out)
    // console.log("end result is",out)
    let generated_src = out.generate()
    // console.log('generate src',generated_src)
    // console.log(generated_src.join("\n"))
    const USER_VARS = []
    let USER_FUNS = []

    USER_FUNS = generated_src

    let TEMPLATE_PATH = "circuitpython_template.py"
    let template = await file_to_string(TEMPLATE_PATH)
    template = template.replace("${USER_VARIABLES}",USER_VARS.join("\n"))
    template = template.replace("${USER_FUNCTIONS}",generated_src)
    await write_to_file(path.join(out_dir, generated_src_out_name), template)
}

async function copy_py_libs(outdir) {
    await copy_file("tasks.py",path.join(outdir,'tasks.py'))
}

async function build(opts) {
    await prep(opts.outdir)
    if(opts.target === 'js') {
        if (opts.browser) await start_webserver(opts.src, opts.outdir)
        await compile_js(opts.src, opts.outdir)
        await copy_js_libs(opts.outdir)
        await web_template(opts.src, opts.outdir)
        if (opts.browser) await start_filewatcher(opts.src, opts.outdir)
    }
    if(opts.target === 'py') {
        await compile_py(opts)
        await copy_py_libs(opts.outdir)
    }
}
build(opts).then(()=>console.log("done compiling"))
