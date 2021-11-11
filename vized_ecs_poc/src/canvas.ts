import {
    DIV,
    ELEM,
    Handle,
    MouseGestureDelegate,
    Movable,
    MovableName,
    Point,
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
    return cp.subtract(canvas.pan_offset)
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
        this.press_point = toCanvasPoint(e,this.canvas)
        let shapes = []
        this.state.pickers.forEach(pk => shapes.push(...pk.pick(this.press_point, this.state)))
        e.shiftKey ? this.state.selection.add(shapes) : this.state.selection.set(shapes)
        this.refresh_handles(shapes)
        this.state.dispatch('selection-change',{})
    }

    move(e: MouseEvent) {
        if (!this.press_point) return
        let drag_point = toCanvasPoint(e,this.canvas)
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
        this.start = toCanvasPoint(e,this.canvas)
    }

    move(e: MouseEvent) {
        let curr = toCanvasPoint(e,this.canvas)
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
    private zoom_level: number

    constructor(root: TreeNode, state: GlobalState) {
        this.pan_offset = new Point(100,50)
        this.zoom_level = 0
        let elem = DIV(['pane', 'canvas-view'], [])
        this.canvas = <HTMLCanvasElement>ELEM('canvas', ['drawing-surface'])
        this.canvas.width = CANVAS_SIZE.width
        this.canvas.height = CANVAS_SIZE.height
        let delegate

        const over_handle = (e: MouseEvent) => {
            let pt = toCanvasPoint(e,this)
            return state.active_handles.find(hand => hand.contains(pt))
        }

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

        state.on("refresh", () => this.refresh())
        state.on("selection-change", ()=>this.refresh())
        state.on("prop-change",()=>this.refresh())
        elem.append(this.canvas)
        this.dom = elem
        this.root = root
        this.state = state
    }
    refresh() {
        let ctx = this.canvas.getContext('2d')
        ctx.fillStyle = 'black'
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
        ctx.save()
        ctx.translate(this.pan_offset.x,this.pan_offset.y)
        this.draw_node(ctx, this.state.get_root())
        this.draw_handles(ctx)
        ctx.restore()
    }
    draw_node(ctx: CanvasRenderingContext2D, root: TreeNode) {
        this.state.renderers.forEach((rend) => rend.render(ctx, root, this.state))
        root.children.forEach(ch => this.draw_node(ctx, ch))
    }

    draw_handles(ctx: CanvasRenderingContext2D) {
        this.state.active_handles.forEach(hand => {
            ctx.fillStyle = 'yellow'
            ctx.fillRect(hand.x, hand.y, hand.w, hand.h)
        })
    }

    get_dom() {
        return this.dom
    }
}
