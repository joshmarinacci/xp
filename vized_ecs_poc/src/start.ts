class Rect {
    constructor(x: number, y: number, w: number, h: number) {
        this.x = x
        this.y = y
        this.w = w
        this.h = h
    }
    x:number
    y:number
    w:number
    h:number
}
class Point {
    x:number
    y:number
    constructor(x: number, y: number) {
        this.x = x
        this.y = y
    }
}

interface Component {
    name:string,
}

function has_component(node:TreeNode, name:string):boolean {
    let comps = node.components.find(comp => comp.name === name)
    if(comps) return true
    return false
}
function get_component(node: TreeNode, name: string):Component {
    return node.components.find(comp => comp.name === name)
}

type TreeNode = {
    parent:TreeNode,
    children:TreeNode[],
    components:Component[],
}

const FilledShapeName = "FilledShapeName"
interface FilledShape extends Component {
    get_color():string
}
class FilledShapeObject implements FilledShape {
    name: string;
    private readonly color: string;
    constructor(color:string) {
        this.name = FilledShapeName
        this.color = color
    }

    get_color(): string {
        return this.color
    }

}
const BoundedShapeName = "BoundedShapeName";
interface BoundedShape extends Component  {
    get_bounds():Rect
}
class BoundedShapeObject implements BoundedShape {
    name: string;
    private readonly rect: Rect;
    constructor(rect:Rect) {
        this.name = BoundedShapeName
        this.rect = rect
    }
    get_bounds(): Rect {
        return this.rect
    }

}

const CircleShapeName = "CircleShapeName"
interface CircleShape extends Component {
    get_position():Point
    get_radius():number
}
class CircleShapeObject implements CircleShape {
    name: string;
    private readonly pos: Point;
    private readonly radius: number;
    constructor(pos:Point, radius:number) {
        this.name = CircleShapeName
        this.pos = pos
        this.radius = radius
    }

    get_position(): Point {
        return this.pos
    }

    get_radius(): number {
        return this.radius
    }

}

//indicates shape can be moved
interface Movable extends Component {
    get_position():Point,
}
interface Resizable extends Component {
    get_size():Point,
}

//make sure parent and child are compatible, then add the child to the parent
function add_child_to_parent(child:TreeNode, parent:TreeNode):void {
    parent.children.push(child)
    child.parent = parent

}
function set_color(child:TreeNode):void {

}
function delete_child_from_parent(child:TreeNode, parent:TreeNode):void {

}
function export_to_SVG(root:TreeNode) {

}
function to_JSON(root:TreeNode) {

}

function DIV(classes: string[], children: any[]) {
    let elem = document.createElement('div')
    classes.forEach(cls => elem.classList.add(cls))
    elem.append(...children)
    return elem
}

function B(text:string) {
    let elem = document.createElement('b')
    elem.innerHTML = text
    return elem
}

function I(text: string) {
    return ELEM('i',[],[text])
    // let elem = document.createElement('i')
    // elem.innerHTML = text
    // return elem
}
function ELEM(name:string,classes:string[],children?:any[]):HTMLElement{
    let elem = document.createElement(name)
    classes.forEach(cls => elem.classList.add(cls))
    if(children) elem.append(...children)
    return elem
}
function LI(classes:string[],children:any[]) {
    return ELEM('li',classes,children)
}
function UL(classes:string[],children:any[]) {
    return ELEM('ul',classes,children)
}

function make_tree_view(root:TreeNode) {
    let elem = DIV(['pane','tree-view'],[])
    let root_div = UL(['tree-node'],[B("root")])
    root.children.forEach(ch => {
        let ch_div = UL(['tree-node'],[B('child')])
        ch.components.forEach(comp => {
            ch_div.append(LI(['component'],[comp.name]))
        })
        root_div.append(ch_div)
    })
    elem.append(root_div)
    return elem
}


function draw_node(ctx: CanvasRenderingContext2D, root: TreeNode, state: GlobalState) {
    state.renderers.forEach((rend)=> rend.render(ctx, root))
    root.children.forEach(ch => draw_node(ctx, ch, state))
}

function make_canvas_view(root:TreeNode, state:GlobalState) {
    let elem = DIV(['pane','canvas-view'],[])
    let canvas:HTMLCanvasElement = <HTMLCanvasElement>ELEM('canvas', ['drawing-surface'])
    canvas.width = 300
    canvas.height = 300

    let ctx = canvas.getContext('2d')
    ctx.fillStyle = 'black'
    ctx.fillRect(0,0,canvas.width,canvas.height)


    draw_node(ctx,root,state)


    elem.append(canvas)
    return elem
}

function make_props_view() {
    let elem = DIV(['pane','props-view'],[])
    return elem
}

// makes three panes
export function make_gui(root:TreeNode, state:GlobalState) {
    let v1 = make_tree_view(root)
    let v2 = make_canvas_view(root,state)
    let v3 = make_props_view()
    return DIV(['main'],[v1,v2,v3])
}

interface System {
    name:string
}
interface RenderingSystem extends System {
    render(ctx: CanvasRenderingContext2D, node: TreeNode):void
}

const RectRendererSystemName = 'RectRendererSystemName'
class RectRendererSystem implements RenderingSystem {
    constructor() {
        this.name = RectRendererSystemName
    }

    render(ctx: CanvasRenderingContext2D, node: TreeNode): void {
        if(has_component(node,BoundedShapeName)) {
            console.log("drawing bounded shape")
            let bd:BoundedShape = <BoundedShape>get_component(node, BoundedShapeName)
            let rect = bd.get_bounds()

            if(has_component(node,FilledShapeName)) {
                let color: FilledShape = <FilledShape>get_component(node, FilledShapeName)
                ctx.fillStyle = color.get_color()
                console.log("using color",color.get_color())
            } else {
                ctx.fillStyle = 'magenta'
            }
            ctx.fillRect(rect.x,rect.y,rect.w,rect.h)
        }
    }

    name: string;
}
const CircleRendererSystemName = 'CircleRendererSystemName'
class CircleRendererSystem implements RenderingSystem {
    name: string

    constructor() {
        this.name = CircleRendererSystemName
    }

    render(ctx: CanvasRenderingContext2D, node: TreeNode): void {
        if(has_component(node,CircleShapeName)) {
            console.log("drawing circle shape")
            let shape:CircleShape = <CircleShape>get_component(node, CircleShapeName)
            if(has_component(node,FilledShapeName)) {
                let color: FilledShape = <FilledShape>get_component(node, FilledShapeName)
                ctx.fillStyle = color.get_color()
                console.log("using color",color.get_color())
            } else {
                ctx.fillStyle = 'magenta'
            }
            ctx.beginPath()
            ctx.arc(shape.get_position().x, shape.get_position().y,shape.get_radius(),0,Math.PI*2)
            ctx.fill()
        }
    }

}

export type GlobalState = {
    systems:any[]
    renderers:RenderingSystem[]
}
export function setup_state():GlobalState {
    let state:GlobalState = {
        systems:[],
        renderers:[],
    }
    state.renderers.push(new RectRendererSystem())
    state.renderers.push(new CircleRendererSystem())
    return state
}

export function make_default_tree(state:GlobalState) {
    let root:TreeNode = {
        children: [], components: [], parent: undefined
    }

    {
        let rect1: TreeNode = {
            children: [], components: [], parent: undefined
        }
        let bds: BoundedShape = new BoundedShapeObject(new Rect(10, 10, 10, 10))
        rect1.components.push(bds)
        let fill = new FilledShapeObject("red")
        rect1.components.push(fill)
        add_child_to_parent(rect1, root)
    }


    {
        let rect2: TreeNode = {
            children: [],
            components: [],
            parent: undefined
        }
        rect2.components.push(new BoundedShapeObject(new Rect(200, 30, 50, 50)))
        rect2.components.push(new FilledShapeObject('blue'))
        add_child_to_parent(rect2, root)
    }
    {
        let circ1: TreeNode = {
            children: [],
            components: [],
            parent: undefined
        }
        circ1.components.push(new FilledShapeObject('green'))
        let circs_hape:CircleShape = new CircleShapeObject(new Point(100,100),20)
        circ1.components.push(circs_hape)
        add_child_to_parent(circ1, root)
    }

    return root
}
// create a tree structure. root w/ three children. two rects and one circle
// build the gui using the tree structure
// tree view should show the current tree structure
// canvas view should render the tree
// add a notion of a single selected element
// props view should render the currently selected elem
// canvas click to set selection
// PickSystem handles selection state and calculating what tree items are at a specific point.
// PickSystem searches for anything with a bounds component, so the root can't be selected since it has no bounds
