import {setup} from './emulator.js'
import {BLACK} from './colors.js'

let SPRITES = [
    {
        name:"small_mario",
        url:"./sprites/mario_luigi.png",
        x:11+32,
        y:9,
        w:16,
        h:16,
        frameCount:3,
        frameHGap:1,
        frames:[]
    },
    {
        name:"small_swim_mario",
        url:"./sprites/mario_luigi.png",
        x:140,
        y:9,
        w:16,
        h:16,
        frameCount:5,
        frameHGap:1,
        frames:[]
    },
    {
        name:"running_fire_mario",
        url:"./sprites/mario_luigi.png",
        x:43,
        y:157,
        w:16,
        h:32,
        frameCount:3,
        frameHGap:1,
        frames:[]
    }
]

let BG = setup()

function renderSprite(BG,sprite,frameNum,x,y) {
    let frame = sprite.frames[frameNum]
    BG.forRect(x,y,sprite.w,sprite.h,(x,y,i,j)=>{
        let n = i%frame.width + j*frame.width
        let color = [
            frame.data[n*4],
            frame.data[n*4+1],
            frame.data[n*4+2],
        ]
        BG.setRGB8(x,y, color)
    })
}
function loadSprite(BG,sprite) {
    // let sprite = SPRITES[2]
    let image = new Image()
    return  new Promise((res,rej)=>{
        image.addEventListener('load',() => {
            sprite.frames = new Array(sprite.frameCount)
            for(let f=0; f<sprite.frameCount; f++) {
                let can = document.createElement('canvas')
                can.width = sprite.w
                can.height = sprite.h
                let ctx = can.getContext('2d')
                let sx = sprite.x+f*sprite.w
                ctx.drawImage(image,
                    sprite.x+(f*(sprite.w+1)),
                    sprite.y,
                    sprite.w,
                    sprite.h,
                    0,0, sprite.w, sprite.h)

                sprite.frames[f] = ctx.getImageData(0,0,can.width,can.height)
            }
            console.log("loaded",sprite.name)
            res(sprite)
        })
        image.src = sprite.url
    })
}
let state = {
    sprites:[],
    sprite:0,
    frame:0,
}

async function loadSprites(BG) {
    for(let sprite of SPRITES) {
        await loadSprite(BG,sprite)
    }
    state.sprites = SPRITES
    state.sprite = 0
    state.frame = 0
}

let count = 0
function drawSprite(BG) {
    let sprite = state.sprites[state.sprite]
    BG.clear(BLACK)
    renderSprite(BG,sprite,state.frame,0,0)
    state.frame = (state.frame + 1)%sprite.frameCount
    count++
    if(count %10 ===0) {
        state.sprite = (state.sprite+1) % state.sprites.length
        state.frame = 0
    }
}

loadSprites(BG).then(()=>{
    setInterval(()=>drawSprite(BG),250)
})

