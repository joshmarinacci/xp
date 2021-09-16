import fs from "fs"
import path from "path"
import {make_grammar_semantics} from './grammar.js'
// lib file
// web template
// generate source

/*


node compile foo.key
produces build/
    foo.js
    foo.html

 */


function error_and_exit(str) {
    console.error(str)
    process.exit(-1)
}

if(!process.argv[2]) error_and_exit("missing input file")

let src_file = process.argv[2]

function log(...args) {
    console.info(...args)
}

// log(process.argv)
log("compiling",src_file)

async function file_to_string(src_file) {
    log("reading from",src_file)
    let raw = await fs.promises.readFile(src_file)
    return raw.toString()
}

let TEMPLATE_PATH = "web_template.html"
let LIB_PATH = "lib.js"
let OUTDIR = "build"
let LIB_OUT_NAME = "lib.js"

async function write_to_file(path, data) {
    log("writing to",path)
    await fs.promises.writeFile(path,data)
}

async function mkdirs(dir) {
    log("making dir",dir)
    await fs.promises.mkdir(dir,{recursive:true})
}

async function build(src_file) {
    let src = await file_to_string(src_file)
    let template = await file_to_string(TEMPLATE_PATH)
    console.log(template)
    let lib = await file_to_string(LIB_PATH)
    let generated_src_prefix = path.basename(src_file,'.key')
    let generated_src_out_name = generated_src_prefix + ".js"
    let generated_template_name = generated_src_prefix + ".html"

    let generated_template = template.replace("${LIB_SRC}","./lib.js")
    generated_template = generated_template.replace("${APP_SRC}",
        "./"+generated_src_out_name)

    await mkdirs(OUTDIR)
    await write_to_file(path.join(OUTDIR, LIB_OUT_NAME), lib)

    const [grammar, semantics] = await make_grammar_semantics()
    let result = grammar.match(src,'Exp')
    if(!result.succeeded()) throw new Error("failed parsing")
    let ast = semantics(result).ast()
    let generated_src = ast_to_js(ast)
    console.log("generated",generated_src)
    await write_to_file(path.join(OUTDIR, generated_src_out_name), generated_src)
    await write_to_file(path.join(OUTDIR, generated_template_name), generated_template)
}

build(src_file).then(()=>log("done"))
