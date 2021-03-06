import {GlobalState} from "./state.js";

export class Point {
    x: number
    y: number

    constructor(x: number, y: number) {
        this.x = x
        this.y = y
    }
    from_object(obj:any) {
        this.x = obj.x
        this.y = obj.y
        return this
    }

    subtract(pt: Point) {
        return new Point(this.x-pt.x, this.y-pt.y)
    }

    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y)
    }

    multiply(scale: number) {
        return new Point(this.x*scale,this.y*scale)
    }
}

export class Rect {
    constructor(x: number, y: number, w: number, h: number) {
        this.x = x
        this.y = y
        this.w = w
        this.h = h
    }

    x: number
    y: number
    w: number
    h: number

    get x2():number {
        return this.x + this.w
    }
    set x2(v:number) {
        this.w = v - this.x
    }
    get y2(): number {
        return this.y + this.h
    }
    set y2(v:number) {
        this.h = v-this.y
    }

    contains(pt: Point):boolean {
        if(pt.x < this.x) return false
        if(pt.y < this.y) return false
        if(pt.x > this.x+this.w) return false
        if(pt.y > this.y+this.h) return false
        return true
    }

    scale(scale: number) {
        return new Rect(this.x*scale,this.y*scale,this.w*scale,this.h*scale)
    }

    add(bounds: Rect) {
        let r2 = new Rect(this.x,this.y,this.w,this.h)
        if(bounds.x < this.x) r2.x = bounds.x
        if(bounds.y < this.y) r2.y = bounds.y
        if(bounds.x2 > this.x2) r2.x2 = bounds.x2
        if(bounds.y2 > this.y2) r2.y2 = bounds.y2
        return r2
    }

    makeEmpty() {
        return new Rect(
            Number.MAX_VALUE,
            Number.MAX_VALUE,
            Number.MIN_VALUE,
            Number.MIN_VALUE
        )
    }

    translate(position: Point) {
        return new Rect(this.x+position.x,this.y+position.y,this.w,this.h)
    }
}


export interface Component {
    name: string,
}

export type TreeNode = {
    id: string,
    parent: TreeNode,
    children: TreeNode[],
    components: Component[],
    has_component(name):boolean
    get_component(name):Component
}

export interface FilledShape extends Component {
    get_color(): string
    set_color(color:string):void
}

//indicates shape can be moved
export const MovableName = "MovableName"
export interface Movable extends Component {
    moveBy(pt:Point):void
}

export const ResizableName = "ResizableName"
export interface Resizable extends Component {
    get_handle(): Handle,
}

export const ParentTranslateName = "ParentTranslateName"
export interface ParentTranslate extends Component {
    get_translation_point(): Point;
}

export interface System {
    name: string
}

export interface RenderingSystem extends System {
    render(ctx: CanvasRenderingContext2D, node: TreeNode, state: GlobalState): void
}
export interface PickingSystem extends System {
    pick_node(pt:Point, node:TreeNode): boolean
}
export interface PropRenderingSystem extends System {
    supports(name: string): any;
    render_view(comp: Component): HTMLElement;
}


export class TreeNodeImpl implements TreeNode {
    id: string
    parent: TreeNode
    children: TreeNode[]
    components: Component[]

    constructor() {
        this.id = "tree_node_" + Math.floor(Math.random() * 1000000)
        this.children = []
        this.components = []
    }


    get_component(name): Component {
        return this.components.find(comp => comp && comp.name === name)
    }

    has_component(name): boolean {
        let comps = this.components.find(comp => comp && comp.name === name)
        if (comps) return true
        return false
    }
}

export const FilledShapeName = "FilledShapeName"

export class FilledShapeObject implements FilledShape {
    name: string;
    private color: string;

    constructor(color: string) {
        this.name = FilledShapeName
        this.color = color
    }

    get_color(): string {
        return this.color
    }
    set_color(color: string) {
        this.color = color
    }

}

const SelectionSystemName = 'SelectionSystemName'

export class SelectionSystem {
    private selection: Set<TreeNode>;

    constructor() {
        this.selection = new Set<TreeNode>()
    }

    add(nodes: TreeNode[]) {
        nodes.forEach(n => this.selection.add(n))
    }

    set(nodes: TreeNode[]) {
        this.selection.clear()
        nodes.forEach(n => this.selection.add(n))
    }

    clear() {
        this.selection.clear()
    }

    get(): TreeNode[] {
        return Array.from(this.selection.values())
    }

    has(nd: TreeNode) {
        return this.selection.has(nd)
    }

    isEmpty() {
        return (this.selection.size<=0)
    }
}

export abstract class Handle extends Rect {
    protected constructor(x, y) {
        super(x,y,10,10);
    }
    update_from_node() {

    }

    moveBy(diff: Point) {

    }
}

export function DIV(classes: string[], children: any[]) {
    let elem = document.createElement('div')
    classes.forEach(cls => elem.classList.add(cls))
    elem.append(...children)
    return elem
}

export function ELEM(name: string, classes: string[], children?: any[]): HTMLElement {
    let elem = document.createElement(name)
    classes.forEach(cls => elem.classList.add(cls))
    if (children) elem.append(...children)
    return elem
}

export function BUTTON(caption: string, cb: any) {
    let elem = ELEM('button', [], [caption])
    elem.addEventListener('click', cb)
    return elem
}

export interface MouseGestureDelegate {
    press(e: MouseEvent)

    move(e: MouseEvent)

    release(e: MouseEvent)
}

export function LABEL(text: string) {
    return ELEM('label', [], [text])
}

export function STRING_INPUT(value: string, cb?: (v:string) => void) {
    let input = document.createElement('input')
    input.setAttribute('type', 'text')
    input.setAttribute('value', value)
    if(!cb) input.setAttribute('disabled',"")
    input.addEventListener('change', (e) => {
        let el: HTMLInputElement = <HTMLInputElement>e.target
        if(cb) cb(el.value)
        // if (!Number.isNaN(el.valueAsNumber)) cb(el.valueAsNumber)
    })
    return input
}

export function NUMBER_INPUT(value: number, cb?: (v:number) => void) {
    let input = document.createElement('input')
    input.setAttribute('type', 'number')
    input.setAttribute('value', value + "")
    if(!cb) input.setAttribute('disabled',"")
    input.addEventListener('change', (e) => {
        let el: HTMLInputElement = <HTMLInputElement>e.target
        if (!Number.isNaN(el.valueAsNumber) && cb) cb(el.valueAsNumber)
    })
    return input
}

export function CHOICE_INPUT(value:string, values:string[], cb:(v:string)=>void) {
    let buttons = values.map(val => BUTTON(val,()=>cb(val)))
    return DIV(["hbox"],buttons)
}

export class FilledShapePropRenderer implements PropRenderingSystem {
    name: string;
    private state:GlobalState
    private colors: string[];

    constructor(state:GlobalState) {
        this.name = "FilledShapePropRenderer"
        this.state = state
        this.colors = [
            '#ff00ff','#ff0000',
            '#ffff00','#00ff00',
            '#00ffff','#0000ff',
            '#ffffff','#000000']
    }

    render_view(comp: Component): HTMLElement {
        let size = 20
        let w = 100
        let wrap = Math.floor(w/size)
        const n2xy = (n) => ({
            x:n%wrap * size,
            y:Math.floor(n/wrap) * 20
        })
        const xy2n = (xy) => {
            let x = Math.floor(xy.x/size)
            let y = Math.floor(xy.y/size)
            return x + y*wrap
        }
        let fill:FilledShape = comp as FilledShape
        let canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = w

        const redraw = () => {
            let ctx = canvas.getContext('2d')
            ctx.fillStyle = 'white'
            ctx.fillRect(0,0,canvas.width,canvas.height)
            this.colors.forEach((color,i)=>{
                ctx.fillStyle = color
                let pt = n2xy(i)
                ctx.fillRect(pt.x,pt.y,20,20)
                if(color === fill.get_color()) {
                    ctx.strokeStyle = 'black'
                    ctx.strokeRect(pt.x,pt.y,20,20)
                }
            })
        }
        canvas.addEventListener('click',(e)=>{
            let target: HTMLElement = <HTMLElement>e.target
            let bounds = target.getBoundingClientRect()
            let pt = new Point(e.clientX - bounds.x, e.clientY - bounds.y)
            let n = xy2n(pt)
            if(n >= 0 && n < this.colors.length) {
                let color = this.colors[n]
                fill.set_color(color)
                this.state.dispatch("prop-change", {})
                redraw()
            }
        })
        redraw()
        return canvas
    }

    supports(name: string): any { return name === FilledShapeName }
}

export function COLOR_PICKER(colors:string[],cb:(v)=>void) {

}

export function forceDownloadBlob(title, blob) {
    // console.log("forcing download of",title)
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = title
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
}

export interface Powerup {
    init(state: GlobalState)
}

