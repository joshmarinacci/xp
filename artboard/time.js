import {setup} from './emulator.js'
import {BLACK, RED} from './colors.js'
import {num_to_double_digits, NUMBER_FONT} from './fonts.js'

let BG = setup()
function drawTime(bg) {
    let now = new Date()
    let chars = []
    chars = [
        ...num_to_double_digits(now.getHours()),
        ':',
        ...num_to_double_digits(now.getMinutes()),
        ':',
        ...num_to_double_digits(now.getSeconds()),
    ]
    let x = 0;
    let y = 10
    bg.fillRect(0,0,32,32,BLACK)
    x += 2
    y += 3
    chars.forEach(ch => {
        let g = NUMBER_FONT[ch]
        bg.drawGlyph(x,y,g,RED)
        x += (g.w + 1)
        if (x > 30) {
            x = 0
            y += 6
        }
    })
}
setInterval(()=> drawTime(BG),1*1000)
