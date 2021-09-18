import {file_to_string, mkdirs, write_to_file} from './util.js'
import fs from "fs"
import path from 'path'
import {ast_to_js, make_grammar_semantics} from './grammar.js'
import {STD_SCOPE} from './lib.js'
import express from "express"

function error_and_exit(str) {
    console.error(str)
    process.exit(-1)
}

function process_options(argv,defs) {
    argv = argv.slice(2)
    // console.log("process args",argv)
    for(let i=0; i<argv.length; i++) {
        // console.log(argv[i])
        if(argv[i] === '--src') {
            i++
            defs.src = argv[i]
        }
        if(argv[i] === '--watch')  defs.watch = true
        if(argv[i] === '--browser')  defs.browser = true
    }
    // console.log("defs",defs)

    return defs
}

let opts = process_options(process.argv,{
    src:null,
    watch:false,
    browser:false,
    outdir:"build",
})
console.log("final opts",opts)

if(!opts.src) error_and_exit("!! missing input file")


async function compile(src_file,OUTDIR) {
        let src = await file_to_string(src_file)
        let generated_src_prefix = path.basename(src_file,'.key')
        let generated_src_out_name = generated_src_prefix + ".js"
        // await mkdirs(OUTDIR)
        // await write_to_file(path.join(OUTDIR, LIB_OUT_NAME), lib)

        const [grammar, semantics] = await make_grammar_semantics()
        let result = grammar.match(src,'Exp')
        if(!result.succeeded()) {
            console.log(result.shortMessage)
            console.log(result.message)
            error_and_exit("failed parsing")
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
        await write_to_file(path.join(OUTDIR, generated_src_out_name), generated_src)
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

async function copy_libs(out_dir) {
    let data = await file_to_string("./lib.js")
    await write_to_file(path.join(out_dir, "lib.js"), data)

    let data2 = await file_to_string("./reload.js")
    await write_to_file(path.join(out_dir, "reload.js"), data2)
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
                await compile(src,outdir)
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

async function build(opts) {
    await prep(opts.outdir)
    if(opts.browser)  await start_webserver(opts.src,opts.outdir)
    await compile(opts.src,opts.outdir)
    await copy_libs(opts.outdir)
    await web_template(opts.src,opts.outdir)
    if(opts.browser)  await start_filewatcher(opts.src,opts.outdir)
}
build(opts).then(()=>console.log("done compiling"))
