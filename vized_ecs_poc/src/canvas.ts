import {
    DIV,
    ELEM,
    Handle,
    MouseGestureDelegate,
    Movable,
    MovableName, ParentTranslate, ParentTranslateName, Point,
    Resizable,
    ResizableName,
    TreeNode
} from "./common.js";
import {GlobalState} from "./state.js";

const CANVAS_SIZE = {
    width:600,
    height:350,
}

export function toCanvasPoint(e: MouseEvent, canvas:CanvasView) {
    let target: HTMLElement = <HTMLElement>e.target
    let bounds = target.getBoundingClientRect()
    let cp = new Point(e.clientX - bounds.x, e.clientY - bounds.y)
    let pt = cp.subtract(canvas.pan_offset)
    let scale = Math.pow(2,canvas.zoom_level)
    return pt.multiply(1/scale)

}

class MouseMoveDelegate implements MouseGestureDelegate {
    press_point: Point
    private state: GlobalState;
    private canvas: CanvasView;

    constructor(state: GlobalState, canvas:CanvasView) {
        this.state = state
        this.canvas = canvas
    }

    press(e: MouseEvent) {
        this.press_point = this.canvas.toRootPoint(e)
        let root = this.canvas.get_current_root()
        //skip root
        let picked:TreeNode = null
        root.children.forEach(ch => {
            this.state.pickers.forEach(pk => {
                if(pk.pick_node(this.press_point, ch))  picked = ch
            })
        })
        if(picked) {
            if(e.shiftKey) {
                this.state.selection.add([picked])
            } else {
                this.state.selection.set([picked])
            }
        } else {
            this.state.selection.clear()
        }
        this.refresh_handles(this.state.selection.get())
        this.state.dispatch('selection-change',{})
    }

    move(e: MouseEvent) {
        if (!this.press_point) return
        let drag_point = this.canvas.toRootPoint(e)
        let diff = drag_point.subtract(this.press_point)
        this.press_point = drag_point
        let movables: TreeNode[] = this.state.selection.get().filter(sh => sh.has_component(MovableName))
        movables.forEach(node => {
            let mov: Movable = <Movable>node.get_component(MovableName)
            mov.moveBy(diff)
        })
        this.state.active_handles.forEach(h => h.update_from_node())
        this.state.dispatch('refresh', {})
    }

    release(e: MouseEvent) {
        this.press_point = null
        this.state.dispatch('object-changed',{})
    }

    private refresh_handles(shapes: any[]) {
        this.state.active_handles = []
        shapes.forEach(shape => {
            if (shape.has_component(ResizableName)) {
                let res: Resizable = <Resizable>shape.get_component(ResizableName)
                this.state.active_handles.push(res.get_handle())
            }
        })
    }
}

class HandleMoveDelegate implements MouseGestureDelegate {
    private state: GlobalState;
    private handle: Handle;
    private start: Point;
    private canvas: CanvasView;

    constructor(state: GlobalState, canvas:CanvasView, hand: Handle) {
        this.state = state
        this.canvas = canvas
        this.handle = hand
    }

    press(e: MouseEvent) {
        this.log("pressed on handle")
        this.start = this.canvas.toRootPoint(e)
    }

    move(e: MouseEvent) {
        let curr = this.canvas.toRootPoint(e)
        let diff = curr.subtract(this.start)
        this.handle.moveBy(diff)
        this.start = curr
        this.state.dispatch('refresh', {})
    }


    release(e: MouseEvent) {
        this.start = null
        this.state.dispatch('object-changed',{})
    }

    private log(...args) {
        console.log("HandleMouseDelegate:", ...args)
    }
}

export class CanvasView {
    private dom: HTMLDivElement;
    private canvas: HTMLCanvasElement;
    private root: TreeNode;
    private state: GlobalState;
    pan_offset: Point
    zoom_level: number
    private inset_button: HTMLButtonElement;

    constructor(root: TreeNode, state: GlobalState) {
        this.pan_offset = new Point(0,0)
        this.zoom_level = 0
        let elem = DIV(['pane', 'canvas-view'], [])
        this.canvas = <HTMLCanvasElement>ELEM('canvas', ['drawing-surface'])
        this.canvas.width = CANVAS_SIZE.width
        this.canvas.height = CANVAS_SIZE.height
        let delegate

        const over_handle = (e: MouseEvent) => {
            let pt = this.toRootPoint(e)
            return state.active_handles.find(hand => hand.contains(pt))
        }
        const over_group = (e:MouseEvent):TreeNode => {
            let pt = toCanvasPoint(e,this)
            for(let ch of this.root.children) {
                if(ch.has_component(ParentTranslateName)) {
                    for(let pk of state.pickers) {
                        if(pk.pick_node(pt,ch)) {
                            return ch
                        }
                    }
                }
            }
            return null
        }

        this.canvas.addEventListener('dblclick',e => {
            let g = over_group(e)
            if(g) this.enter_inset(g)
        })
        this.canvas.addEventListener('mousedown', e => {
            //check if pressed on a handle
            let hand: Handle = over_handle(e)
            if (hand) {
                delegate = new HandleMoveDelegate(state, this, hand)
            } else {
                delegate = new MouseMoveDelegate(state,this)
            }
            delegate.press(e)
        })
        this.canvas.addEventListener('mousemove', e => delegate?delegate.move(e):"")
        this.canvas.addEventListener('mouseup', e => {
            if(delegate) delegate.release(e)
            delegate = null
        })
        this.canvas.addEventListener('wheel',(e:WheelEvent) => {
            this.pan_offset.x += e.deltaX/10
            this.pan_offset.y += e.deltaY/10
            this.refresh()
        })

        state.on("refresh", () => this.refresh())
        state.on("selection-change", ()=>this.refresh())
        state.on("prop-change",()=>this.refresh())
        this.inset_button = document.createElement('button')
        this.inset_button.innerText = "exit"
        this.inset_button.setAttribute('disabled',"")
        this.inset_button.addEventListener('click',() => {
            this.exit_inset()
        })
        elem.append(this.inset_button)
        elem.append(this.canvas)
        this.dom = elem
        this.root = root
        this.state = state
    }
    refresh() {
        let scale = Math.pow(2,this.zoom_level)
        let ctx = this.canvas.getContext('2d')
        ctx.fillStyle = 'black'
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
        ctx.fillStyle = '#f0f0f0'
        ctx.fillRect(0+2, 0+2, this.canvas.width-4, this.canvas.height-4)
        ctx.save()
        ctx.translate(this.pan_offset.x,this.pan_offset.y)
        ctx.scale(scale,scale)
        this.draw_node(ctx, this.get_current_root())
        this.draw_handles(ctx,this.get_current_root())
        ctx.restore()
    }
    draw_node(ctx: CanvasRenderingContext2D, node: TreeNode) {
        //draw the current node
        this.state.renderers.forEach((rend) => rend.render(ctx, node, this.state))
        //get transform for children
        ctx.save()
        if(node.has_component(ParentTranslateName)) {
            let trans = node.get_component(ParentTranslateName) as ParentTranslate
            let offset = trans.get_translation_point()
            ctx.translate(offset.x,offset.y)
        }
        node.children.forEach(ch => this.draw_node(ctx, ch))
        ctx.restore()
    }

    draw_handles(ctx: CanvasRenderingContext2D, node:TreeNode) {
        let off = new Point(0,0)
        if(node.has_component(ParentTranslateName)) {
            let pt = (node.get_component(ParentTranslateName) as ParentTranslate).get_translation_point()
            off = pt
        }
        this.state.active_handles.forEach(hand => {
            ctx.fillStyle = 'yellow'
            ctx.fillRect(off.x+hand.x, off.y+hand.y, hand.w, hand.h)
        })
    }

    get_dom() {
        return this.dom
    }

    zoom_in() {
        this.zoom_level += 1
        this.refresh()
    }

    zoom_out() {
        this.zoom_level -= 1
        this.refresh()
    }

    private enter_inset(g: TreeNode) {
        this.root = g
        this.inset_button.removeAttribute('disabled')
        this.refresh()
    }

    private exit_inset() {
        this.root = this.state.get_root()
        this.inset_button.setAttribute('disabled','')
        this.refresh()
    }

    get_current_root() {
        return this.root
    }

    toRootPoint(e: MouseEvent) {
        let pt = toCanvasPoint(e,this)
        let root = this.get_current_root()
        if(root.has_component(ParentTranslateName)) {
            let off = (root.get_component(ParentTranslateName) as ParentTranslate).get_translation_point()
            pt = pt.subtract(off)
        }
        return pt
    }
}
