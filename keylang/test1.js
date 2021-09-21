import {KCanvas, KList, KRect, KColor, KObj,KPoint, KVector,randi,randf,choose,range,wrap,add, wait} from "./libs_js/common.js"

let screen = new KCanvas(0,0,64,32,"#canvas")
/* ========== everything above here will be generated */

let palette = new KList()
let black = new KColor(0,0,0)
let red = new KColor(1,0,0)
let green =new KColor(0,1,0)
let blue = new KColor(0,0,1)

let dots
function setup_drips() {
    palette = new KList(black,red,green,blue)
    function MakeDot() {
        let dot = new KObj()
        dot.xy = new KPoint(randi(screen.width),randi(1))
        dot.v = new KVector(randf(0,1), randf(0.5,1.5))
        dot.color = choose(palette)
        return dot
    }
    dots = range(20).map(()=>MakeDot())

}

function draw_dots() {
    dots.forEach(dot => {
        dot.xy = wrap(add(dot.xy,dot.v), [0,0], screen.size)
        screen.setPixel(dot.xy,dot.color)
    })
    wait(1)
}

/* ========== everything below here will be generated ========= */

setup_drips()
function do_cycle() {
    screen.clear()
    draw_dots()
    setTimeout(do_cycle,100)
}
do_cycle()
