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

function draw_node(ctx: CanvasRenderingContext2D, root: TreeNode, state: GlobalState) {
    state.renderers.forEach((rend) => rend.render(ctx, root, state))
    root.children.forEach(ch => draw_node(ctx, ch, state))
}

function draw_handles(ctx: CanvasRenderingContext2D, state: GlobalState) {
    state.active_handles.forEach(hand => {
        ctx.fillStyle = 'yellow'
        ctx.fillRect(hand.x, hand.y, hand.w, hand.h)
    })
}

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
        shapes.forEach(shape => {
            if (has_component(shape, ResizableName)) {
                let res: Resizable = <Resizable>get_component(shape, ResizableName)
                this.state.active_handles.push(res.get_handle())
            }
        })
        this.state.dispatch('refresh', {})
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
        this.state.dispatch('refresh', {})
    }

    release(e: MouseEvent) {
        this.press_point = null
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

    constructor(root: TreeNode, state: GlobalState) {
        let elem = DIV(['pane', 'canvas-view'], [])
        let canvas: HTMLCanvasElement = <HTMLCanvasElement>ELEM('canvas', ['drawing-surface'])
        canvas.width = 300
        canvas.height = 300
        let delegate

        function over_handle(e: MouseEvent) {
            let pt = toCanvasPoint(e)
            let hand = state.active_handles.find(hand => hand.contains(pt))
            return hand
        }

        canvas.addEventListener('mousedown', e => {
            //check if pressed on a handle
            let hand: Handle = over_handle(e)
            if (hand) {
                delegate = new HandleMoveDelegate(state, hand)
            } else {
                delegate = new MouseMoveDelegate(state)
            }
            delegate.press(e)
        })
        canvas.addEventListener('mousemove', e => {
            if (delegate) delegate.move(e)
        })
        canvas.addEventListener('mouseup', e => {
            if (delegate) delegate.release(e)
            delegate = null
        })

        function refresh() {
            let ctx = canvas.getContext('2d')
            ctx.fillStyle = 'black'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            draw_node(ctx, root, state)
            draw_handles(ctx, state)
        }

        state.on("refresh", () => {
            refresh()
        })

        elem.append(canvas)
        this.dom = elem
    }

    get_dom() {
        return this.dom
    }
}
