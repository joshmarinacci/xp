import {hslToRgb} from './colors.js'
import {setup} from './emulator.js'
import {lerp, remap} from "./util.js"

function drawMandle(BG) {
    function calc_pixel(cx, cy) {
        let i = 0
        let zx = 0
        let zy = 0
        do {
            let xt = zx * zy
            zx = zx * zx - zy * zy + cx
            zy = 2 * xt + cy
            i++
        }
        while (i < 255 && (zx * zx + zy * zy) < 4)
        return 255 -i
    }

    const range = (count) => {
        let arr = new Array(count)
        for (let i = 0; i < count; i++) {
            arr[i] = i
        }
        return arr
    }


    let rainbow = range(256).map(i => {
        let t = i/255
        let hue = lerp(t, 0.2,0.9)
        let sat = lerp(t,.8,1)
        let lit = lerp(t,.5,.5)
        return hslToRgb(hue,sat,lit)
        // return `hsl(${hue.toFixed(0)},${sat}%,${lit}%)`
    })

    BG.forRect(0,0,BG.width, BG.height,(x,y,i,j)=>{
        let xx = remap(x,0,BG.width, -0.35,-0.15)
        let yy = remap(y,0,BG.height, -0.8,-0.6)
        let index = calc_pixel(xx,yy)
        BG.setRGB8(x,y,rainbow[index])
    })

}

let BG = setup()
drawMandle(BG)
