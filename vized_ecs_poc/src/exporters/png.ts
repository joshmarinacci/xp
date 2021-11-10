import {BoundedShape, BoundedShapeName, forceDownloadBlob, TreeNode} from "../common.js";
import {GlobalState} from "../state.js";

function to_PNG(ctx: CanvasRenderingContext2D, node: TreeNode, state: GlobalState) {
    state.renderers.forEach(red => {
        red.render(ctx,node,state)
    })
}

export function export_PNG(root: TreeNode, state: GlobalState) {
    let bds = {
        w:500,
        h:500,
    }
    if(root.has_component(BoundedShapeName)) {
        let bounds = root.get_component(BoundedShapeName) as BoundedShape
        let rect = bounds.get_bounds()
        bds.w = rect.w
        bds.h = rect.h
    }

    let canvas = document.createElement('canvas')
    canvas.width = bds.w
    canvas.height = bds.h
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
    canvasToPNGBlob(canvas).then((blob)=> forceDownloadBlob(`test.png`,blob))

}
