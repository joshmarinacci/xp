import {
    CirclePickSystem,
    CircleRendererSystem,
    CircleShape,
    CircleShapeObject, MovableCircleObject
} from "./circle_powerup.js";
import {
    BoundedShape,
    BoundedShapeObject,
    FilledShapeObject, get_component, has_component, Movable, MovableName,
    PickingSystem,
    Point,
    Rect,
    RenderingSystem,
    SelectionSystem, SVGExporter,
    TreeNode,
    TreeNodeImpl
} from "./common.js";
import {
    MovableRectObject,
    RectPickSystem,
    RectRendererSystem,
    RectSVGExporter
} from "./rect_powerup.js";


//make sure parent and child are compatible, then add the child to the parent
function add_child_to_parent(child:TreeNode, parent:TreeNode):void {
    parent.children.push(child)
    child.parent = parent

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

function make_tree_view(root:TreeNode, state:GlobalState) {
    let elem = DIV(['pane','tree-view'],[])
    let root_div = UL(['tree-node'],[B("root")])
    function refresh() {
        root_div.childNodes.forEach((ch:HTMLElement) => {
            let nd:TreeNode = state.lookup_treenode(ch.dataset.nodeid)
            if(state.selection.has(nd)) {
                ch.classList.add('selected')
            } else {
                ch.classList.remove('selected')
            }
        })
    }
    root.children.forEach(ch => {
        let ch_div = UL(['tree-node'],[B('child')])
        ch_div.dataset.nodeid = ch.id
        ch_div.addEventListener('click',(e)=>{
            let sel = state.selection
            e.shiftKey?sel.add([ch]):sel.set([ch])
            state.dispatch('refresh',{})
        })
        ch.components.forEach(comp => {
            ch_div.append(LI(['component'],[comp.name]))
        })
        root_div.append(ch_div)
    })
    elem.append(root_div)
    refresh()
    state.on("refresh",refresh)
    return elem
}

function draw_node(ctx: CanvasRenderingContext2D, root: TreeNode, state: GlobalState) {
    state.renderers.forEach((rend)=> rend.render(ctx, root,state))
    root.children.forEach(ch => draw_node(ctx, ch, state))
}

function log(...args) {
    console.log(...args)
}

function make_canvas_view(root:TreeNode, state:GlobalState) {
    let elem = DIV(['pane','canvas-view'],[])
    let canvas:HTMLCanvasElement = <HTMLCanvasElement>ELEM('canvas', ['drawing-surface'])
    canvas.width = 300
    canvas.height = 300



    function toCanvasPoint(e: MouseEvent) {
        let target:HTMLElement = <HTMLElement>e.target
        let bounds = target.getBoundingClientRect()
        return new Point(e.clientX - bounds.x, e.clientY - bounds.y)
    }

    let press_point
    canvas.addEventListener('mousedown',e => {
        press_point = toCanvasPoint(e)
        let shapes = []
        state.pickers.forEach(pk => shapes.push(...pk.pick(press_point,state)))
        e.shiftKey?state.selection.add(shapes):state.selection.set(shapes)
        state.dispatch('refresh',{})
    })
    canvas.addEventListener('mousemove',e => {
        if(!press_point) return
        let drag_point = toCanvasPoint(e)
        let diff = drag_point.subtract(press_point)
        press_point = drag_point
        let movables:TreeNode[] = state.selection.get().filter(sh => has_component(sh,MovableName))
        movables.forEach(node => {
            let mov:Movable = <Movable>get_component(node, MovableName)
            mov.moveBy(diff)
        })
        state.dispatch('refresh',{})
    })
    canvas.addEventListener('mouseup',e => {
        press_point = null
    })

    function refresh() {
        let ctx = canvas.getContext('2d')
        ctx.fillStyle = 'black'
        ctx.fillRect(0,0,canvas.width,canvas.height)
        draw_node(ctx,root,state)
    }

    state.on("refresh",() => {
        refresh()
    })

    elem.append(canvas)
    return elem
}

function make_props_view() {
    let elem = DIV(['pane','props-view'],[])
    return elem
}

function BUTTON(caption: string, cb:any) {
    let elem = ELEM('button',[],[caption])
    elem.addEventListener('click',cb)
    return elem
}

function treenode_to_POJO(root: TreeNode) {
    let obj = {
    }
    Object.keys(root).forEach(key => {
        if(key === 'parent') return
        if(key === 'children') {
            obj[key] = root.children.map(ch => treenode_to_POJO(ch))
            return
        }
        obj[key] = root[key]
    })
    return obj
}

function export_JSON(root: TreeNode) {
    console.log("exporting to JSON",root)
    let obj = treenode_to_POJO(root)
    console.log("obj is",obj)
    let str = JSON.stringify(obj,null,'  ')
    console.log(str)
}

function treenode_to_SVG(node: TreeNode, state:GlobalState) {
    let exp = state.svgexporters.find(exp => exp.canExport(node))
    return exp?exp.toSVG(node):""
}

function export_SVG(root: TreeNode, state:GlobalState) {
    console.log("exporting to SVG",root)
    let chs = root.children.map(ch => treenode_to_SVG(ch,state))
    let template = `<?xml version="1.0" standalone="no"?>
    <svg width="400" height="400" version="1.1" xmlns="http://www.w3.org/2000/svg">
    ${chs.join("\n")}
    </svg>
    `
    console.log("template output",template)
    let blog = new Blob([template.toString()])
    forceDownloadBlob('demo.svg',blog)
}
function forceDownloadBlob(title,blob) {
    // console.log("forcing download of",title)
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = title
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
}

function make_toolbar(state:GlobalState) {
    let chi = [
        BUTTON("export JSON",()=> export_JSON(state.get_root())),
        BUTTON("export SVG",()=> export_SVG(state.get_root(), state)),
    ]
    let elem = DIV(['toolbar'],chi)
    return elem
}

// makes three panes
export function make_gui(root:TreeNode, state:GlobalState) {
    let v1 = make_tree_view(root,state)
    let v2 = make_canvas_view(root,state)
    let v3 = make_props_view()
    let v4 = make_toolbar(state)
    return DIV(['main'],[v4,v1,v2,v3])
}




type Callback = (any) => void
export class GlobalState {
    systems:any[]
    renderers:RenderingSystem[]
    svgexporters:SVGExporter[]
    selection:SelectionSystem
    pickers:PickingSystem[]
    private root: TreeNode;
    private listeners:Map<string,Callback[]>
    constructor() {
        this.systems = []
        this.renderers = []
        this.pickers = []
        this.svgexporters = []
        this.selection = new SelectionSystem()
        this.listeners = new Map<string, Callback[]>()
    }
    lookup_treenode(id:string):TreeNode {
        return this.search_treenode_by_id(this.root,id)
    }

    set_root(tree: TreeNode) {
        this.root = tree
    }

    private search_treenode_by_id(root: TreeNode, id: string):TreeNode {
        if(root.id === id) return root
        for(let ch of root.children) {
            let ret = this.search_treenode_by_id(ch,id)
            if(ret) return ret
        }
        return undefined
    }

    on(type: string, cb:Callback) {
        this._get_listeners(type).push(cb)
    }

    private _get_listeners(type: string) {
        if(!this.listeners.has(type)) this.listeners.set(type,[])
        return this.listeners.get(type)
    }

    dispatch(type: string, payload: any) {
        // this.log("dispatching",type,payload)
        this._get_listeners(type).forEach(cb => cb(payload))
    }

    private log(...args) {
        console.log("GLOBAL:",...args)
    }

    get_root():TreeNode {
        return this.root
    }
}



export function setup_state():GlobalState {
    let state:GlobalState = new GlobalState()
    state.renderers.push(new RectRendererSystem())
    state.renderers.push(new CircleRendererSystem())
    state.pickers.push(new RectPickSystem())
    state.pickers.push(new CirclePickSystem())
    state.svgexporters.push(new RectSVGExporter())
    return state
}

export function make_default_tree(state:GlobalState) {
    let root:TreeNode = new TreeNodeImpl()
    {
        let rect1 = new TreeNodeImpl()
        let bds: BoundedShape = new BoundedShapeObject(new Rect(10, 10, 10, 10))
        rect1.components.push(bds)
        let fill = new FilledShapeObject("red")
        rect1.components.push(fill)
        rect1.components.push(new MovableRectObject(rect1))
        add_child_to_parent(rect1, root)
    }


    {
        let rect2: TreeNode = new TreeNodeImpl()
        rect2.components.push(new BoundedShapeObject(new Rect(200, 30, 50, 50)))
        rect2.components.push(new FilledShapeObject('blue'))
        rect2.components.push(new MovableRectObject(rect2))
        add_child_to_parent(rect2, root)
    }
    {
        let circ1: TreeNode = new TreeNodeImpl()
        circ1.components.push(new FilledShapeObject('green'))
        let circle_shape:CircleShape = new CircleShapeObject(new Point(100,100),20)
        circ1.components.push(circle_shape)
        circ1.components.push(new MovableCircleObject(circ1))
        add_child_to_parent(circ1, root)
    }

    return root
}


// [ ] canvas click to set selection
// [x] tree view click to set selection
// [x] canvas shows selection just using bounds
// [x] tree view shows selection too

// PickSystem handles selection state and calculating what tree items are at a specific point.
// PickSystem searches for anything with a bounds component, so the root can't be selected since it has no bounds
