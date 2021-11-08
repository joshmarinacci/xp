import {
    CirclePickSystem,
    CircleRendererSystem,
    CircleShape,
    CircleShapeObject,
    MovableCircleObject
} from "./circle_powerup.js";
import {
    BoundedShape,
    BoundedShapeObject,
    BUTTON,
    DIV,
    ELEM,
    FilledShapeObject,
    Point, PropRenderingSystem,
    Rect,
    TreeNode,
    TreeNodeImpl
} from "./common.js";
import {
    MovableRectObject,
    RectPickSystem, RectPropRendererSystem,
    RectRendererSystem,
    RectSVGExporter,
    ResizableRectObject
} from "./rect_powerup.js";
import {GlobalState} from "./state.js";
import {CanvasView} from "./canvas.js";


//make sure parent and child are compatible, then add the child to the parent
function add_child_to_parent(child:TreeNode, parent:TreeNode):void {
    parent.children.push(child)
    child.parent = parent
}

function B(text:string) {
    let elem = document.createElement('b')
    elem.innerHTML = text
    return elem
}

function I(text: string) {
    return ELEM('i',[],[text])
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
            state.dispatch('selection-change',{})
        })
        ch.components.forEach(comp => {
            ch_div.append(LI(['component'],[comp.name]))
        })
        root_div.append(ch_div)
    })
    elem.append(root_div)
    refresh()
    state.on("refresh",refresh)
    state.on("selection-change", refresh)
    return elem
}

function log(...args) {
    console.log(...args)
}


function make_canvas_view(root:TreeNode, state:GlobalState) {
    let canvas = new CanvasView(root,state)
    return canvas.get_dom()
}

function make_props_view(state: GlobalState) {
    let div = DIV(['pane','props-view'],[])
    state.on("selection-change",() => {
        console.log("selection changed", state.selection)
        while(div.firstChild) div.removeChild(div.firstChild)
        if(state.selection.isEmpty()) {
            div.append(B("Nothing Selecte"))
        } else {
            let node = state.selection.get()[0]
            let panel = DIV(['group'],['its a node'])
            div.append(panel)
            node.components.forEach(comp => {
                let pr:PropRenderingSystem = state.props_renderers.find(pr => pr.supports(comp.name))
                if(pr) {
                    let comp_div = DIV(['group'],[`${comp.name}`])
                    comp_div.append(pr.render_view(comp))
                    div.append(comp_div)
                }
            })
        }
    })
    return div
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
    let v3 = make_props_view(state)
    let v4 = make_toolbar(state)
    return DIV(['main'],[v4,v1,v2,v3])
}

export function setup_state():GlobalState {
    let state:GlobalState = new GlobalState()
    state.renderers.push(new RectRendererSystem())
    state.renderers.push(new CircleRendererSystem())
    state.pickers.push(new RectPickSystem())
    state.pickers.push(new CirclePickSystem())
    state.svgexporters.push(new RectSVGExporter())
    state.props_renderers.push(new RectPropRendererSystem(state))
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
        rect2.components.push(new ResizableRectObject(rect2))
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
