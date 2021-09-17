import path from "path"
import {ast_to_js, make_grammar_semantics} from './grammar.js'
import {file_to_string, log, mkdirs, write_to_file} from './util.js'
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

// log(process.argv)
log("compiling",src_file)

let TEMPLATE_PATH = "web_template.html"
let LIB_PATH = "lib.js"
let OUTDIR = "build"
let LIB_OUT_NAME = "lib.js"

export async function build(src_file) {
    let src = await file_to_string(src_file)
    let template = await file_to_string(TEMPLATE_PATH)
    // console.log(template)
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
    let generated_src = ast_to_js(ast).join("\n")
    let prelude = `
import * as lib from "./lib.js"
import {KCanvas, randi, randf, choose, wrap } from "./lib.js"
// import {KCanvas, KList, KRect, KColor, KObj,KPoint, KVector,randi,randf,choose,range,wrap,add, wait} from "./lib.js"
        const add = lib.STD_SCOPE.add
        const List = lib.STD_SCOPE.List
        const range = lib.STD_SCOPE.range
        const Color = lib.STD_SCOPE.Color
        const Canvas = lib.STD_SCOPE.Canvas
        const Obj = lib.STD_SCOPE.Obj
        const Point = lib.STD_SCOPE.Point
        const Vector = lib.STD_SCOPE.Vector
        const Rect   = lib.STD_SCOPE.Rect
let screen = new KCanvas(0,0,64,32,"#canvas")
    `
    let postlude = `
setup_drips()
function do_cycle() {
    screen.clear()
    draw_dots()
    setTimeout(do_cycle,100)
}
do_cycle()
    `
    generated_src = prelude + generated_src + postlude
    console.log("generated",generated_src)
    await write_to_file(path.join(OUTDIR, generated_src_out_name), generated_src)
    await write_to_file(path.join(OUTDIR, generated_template_name), generated_template)
}

build(src_file).then(()=>log("done"))
