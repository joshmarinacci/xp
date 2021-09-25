import {build} from './compile.js'

function error_and_exit(...args) {
    console.error(...args)
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


let INSTRUCTIONS = `
node build --src demos/canvas/lines01.key --target js --browser
`

if(!opts.src) error_and_exit("!! missing input file", INSTRUCTIONS)
if(!opts.target) error_and_exit("target output language must be specified. js or py", INSTRUCTIONS)

build(opts).then(()=>console.log("done compiling"))
