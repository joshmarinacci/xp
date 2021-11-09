import {TreeNode} from "../common.js";
import {GlobalState} from "../state.js";

function to_PNG(ctx: CanvasRenderingContext2D, node: TreeNode, state: GlobalState) {
    state.renderers.forEach(red => {
        red.render(ctx,node,state)
    })
}

export function export_PNG(root: TreeNode, state: GlobalState) {
    let canvas = document.createElement('canvas')
    canvas.width = 500
    canvas.height = 500
    let ctx = canvas.getContext('2d')
    ctx.fillStyle = 'white'
    ctx.fillRect(0,0,canvas.width,canvas.height)

    root.children.forEach(ch => to_PNG(ctx, ch, state))

    function canvasToPNGBlob(canvas) {
        return new Promise((res,rej)=>{
            canvas.toBlob((blob)=>{
                res(blob)
            },'image/png')
        })
    }
    function forceDownloadBlob(title,blob) {
        console.log("forcing download of",title)
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = title
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
    }
    canvasToPNGBlob(canvas).then((blob)=> forceDownloadBlob(`test.png`,blob))

}
