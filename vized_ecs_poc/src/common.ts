import {GlobalState} from "./state";

export class Point {
    x: number
    y: number

    constructor(x: number, y: number) {
        this.x = x
        this.y = y
    }

    subtract(pt: Point) {
        return new Point(this.x-pt.x, this.y-pt.y)
    }

    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y)
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

    contains(pt: Point):boolean {
        if(pt.x < this.x) return false
        if(pt.y < this.y) return false
        if(pt.x > this.x+this.w) return false
        if(pt.y > this.y+this.h) return false
        return true
    }
}


export interface Component {
    name: string,
}

export function has_component(node: TreeNode, name: string): boolean {
    let comps = node.components.find(comp => comp.name === name)
    if (comps) return true
    return false
}

export function get_component(node: TreeNode, name: string): Component {
    return node.components.find(comp => comp.name === name)
}

export type TreeNode = {
    id: string,
    parent: TreeNode,
    children: TreeNode[],
    components: Component[],
}

export interface FilledShape extends Component {
    get_color(): string
}

export interface BoundedShape extends Component {
    get_bounds(): Rect
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

export interface System {
    name: string
}

export interface RenderingSystem extends System {
    render(ctx: CanvasRenderingContext2D, node: TreeNode, state: GlobalState): void
}
export interface PickingSystem extends System {
    pick(pt:Point, state:GlobalState): TreeNode[]
}
export interface PropRenderingSystem extends System {
    supports(name: string): any;
    render_view(comp: Component): HTMLElement;
}

export interface SVGExporter extends System {
    canExport(node:TreeNode):boolean
    toSVG(node:TreeNode):string
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
}

export const FilledShapeName = "FilledShapeName"

export class FilledShapeObject implements FilledShape {
    name: string;
    private readonly color: string;

    constructor(color: string) {
        this.name = FilledShapeName
        this.color = color
    }

    get_color(): string {
        return this.color
    }

}

export const BoundedShapeName = "BoundedShapeName";

export class BoundedShapeObject implements BoundedShape {
    name: string;
    private readonly rect: Rect;

    constructor(rect: Rect) {
        this.name = BoundedShapeName
        this.rect = rect
    }

    get_bounds(): Rect {
        return this.rect
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

export function toCanvasPoint(e: MouseEvent) {
    let target: HTMLElement = <HTMLElement>e.target
    let bounds = target.getBoundingClientRect()
    return new Point(e.clientX - bounds.x, e.clientY - bounds.y)
}

export interface MouseGestureDelegate {
    press(e: MouseEvent)

    move(e: MouseEvent)

    release(e: MouseEvent)
}
