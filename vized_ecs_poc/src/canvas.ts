import {
    DIV,
    ELEM,
    get_component,
    Handle,
    has_component,
    MouseGestureDelegate,
    Movable,
    MovableName,
    Point,
    Resizable,
    ResizableName,
    toCanvasPoint,
    TreeNode
} from "./common.js";
import {GlobalState} from "./state.js";



class MouseMoveDelegate implements MouseGestureDelegate {
    press_point: Point
    private state: GlobalState;

    constructor(state: GlobalState) {
        this.state = state
    }

    press(e: MouseEvent) {
        this.press_point = toCanvasPoint(e)
        let shapes = []
        this.state.pickers.forEach(pk => shapes.push(...pk.pick(this.press_point, this.state)))
        e.shiftKey ? this.state.selection.add(shapes) : this.state.selection.set(shapes)
        this.refresh_handles(shapes)
        this.state.dispatch('selection-change',{})
    }

    move(e: MouseEvent) {
        if (!this.press_point) return
        let drag_point = toCanvasPoint(e)
        let diff = drag_point.subtract(this.press_point)
        this.press_point = drag_point
        let movables: TreeNode[] = this.state.selection.get().filter(sh => has_component(sh, MovableName))
        movables.forEach(node => {
            let mov: Movable = <Movable>get_component(node, MovableName)
            mov.moveBy(diff)
        })
        this.state.active_handles.forEach(h => h.update_from_node())
        this.state.dispatch('refresh', {})
    }

    release(e: MouseEvent) {
        this.press_point = null
    }

    private refresh_handles(shapes: any[]) {
        this.state.active_handles = []
        shapes.forEach(shape => {
            if (has_component(shape, ResizableName)) {
                let res: Resizable = <Resizable>get_component(shape, ResizableName)
                this.state.active_handles.push(res.get_handle())
            }
        })
    }
}

class HandleMoveDelegate implements MouseGestureDelegate {
    private state: GlobalState;
    private handle: Handle;
    private start: Point;

    constructor(state: GlobalState, hand: Handle) {
        this.state = state
        this.handle = hand
    }

    press(e: MouseEvent) {
        this.log("pressed on handle")
        this.start = toCanvasPoint(e)
    }

    move(e: MouseEvent) {
        let curr = toCanvasPoint(e)
        let diff = curr.subtract(this.start)
        this.handle.moveBy(diff)
        this.start = curr
        this.state.dispatch('refresh', {})
    }


    release(e: MouseEvent) {
        this.start = null
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

    constructor(root: TreeNode, state: GlobalState) {
        let elem = DIV(['pane', 'canvas-view'], [])
        this.canvas = <HTMLCanvasElement>ELEM('canvas', ['drawing-surface'])
        this.canvas.width = 300
        this.canvas.height = 300
        let delegate

        function over_handle(e: MouseEvent) {
            let pt = toCanvasPoint(e)
            let hand = state.active_handles.find(hand => hand.contains(pt))
            return hand
        }

        this.canvas.addEventListener('mousedown', e => {
            //check if pressed on a handle
            let hand: Handle = over_handle(e)
            if (hand) {
                delegate = new HandleMoveDelegate(state, hand)
            } else {
                delegate = new MouseMoveDelegate(state)
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
        elem.append(this.canvas)
        this.dom = elem
        this.root = root
        this.state = state
    }
    refresh() {
        let ctx = this.canvas.getContext('2d')
        ctx.fillStyle = 'black'
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
        this.draw_node(ctx, this.root)
        this.draw_handles(ctx)
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
