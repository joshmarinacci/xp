import {
    BoundedShape,
    BoundedShapeName, Component, DIV, ELEM,
    FilledShape,
    FilledShapeName,
    get_component, Handle,
    has_component, Movable, MovableName,
    PickingSystem,
    Point, PropRenderingSystem,
    RenderingSystem, Resizable, ResizableName, SVGExporter,
    TreeNode
} from "./common.js";
import {GlobalState} from "./state";

const RectRendererSystemName = 'RectRendererSystemName'

export class RectRendererSystem implements RenderingSystem {
    constructor() {
        this.name = RectRendererSystemName
    }

    render(ctx: CanvasRenderingContext2D, node: TreeNode, state: GlobalState): void {
        if (has_component(node, BoundedShapeName)) {
            let bd: BoundedShape = <BoundedShape>get_component(node, BoundedShapeName)
            let rect = bd.get_bounds()

            if (has_component(node, FilledShapeName)) {
                let color: FilledShape = <FilledShape>get_component(node, FilledShapeName)
                ctx.fillStyle = color.get_color()
            } else {
                ctx.fillStyle = 'magenta'
            }
            ctx.fillRect(rect.x, rect.y, rect.w, rect.h)
            if (state.selection.has(node)) {
                ctx.strokeStyle = 'magenta'
                ctx.lineWidth = 3.5
                ctx.strokeRect(rect.x, rect.y, rect.w, rect.h)
            }
        }
    }

    name: string;
}

const RectPickSystemName = 'RectPickSystemName';

export class RectPickSystem implements PickingSystem {
    name: string;

    constructor() {
        this.name = RectPickSystemName
    }

    pick(pt: Point, state: GlobalState): TreeNode[] {
        let picked = []
        this._test_node(pt, state.get_root(), picked)
        return picked
    }

    private _test_node(pt: Point, node: TreeNode, collect: TreeNode[]) {
        if (has_component(node, BoundedShapeName)) {
            let rect = (<BoundedShape>get_component(node, BoundedShapeName)).get_bounds()
            if (rect.contains(pt)) collect.push(node)
        }
        node.children.forEach((ch: TreeNode) => {
            this._test_node(pt, ch, collect)
        })
    }
}

export class RectSVGExporter implements SVGExporter {
    name: string;

    canExport(node: TreeNode): boolean {
        return has_component(node,BoundedShapeName)
    }

    toSVG(node: TreeNode): string {
        let bd: BoundedShape = <BoundedShape>get_component(node, BoundedShapeName)
        let rect = bd.get_bounds()
        let color: FilledShape = <FilledShape>get_component(node, FilledShapeName)
        let obj = {
            x:rect.x,
            y:rect.y,
            width:rect.w,
            height:rect.w,
            fill:color.get_color()
        }
        let pairs = Object.keys(obj).map(k => `${k}='${obj[k]}'`)
        return '<rect ' + pairs.join(" ") + "/>"
    }

}

export class MovableRectObject implements Movable {
    name: string;
    private node: TreeNode;
    constructor(node:TreeNode) {
        this.node = node
        this.name = MovableName
    }
    moveBy(pt: Point): void {
        let bd:BoundedShape = <BoundedShape>get_component(this.node, BoundedShapeName)
        bd.get_bounds().x += pt.x
        bd.get_bounds().y += pt.y
    }
}

class RectHandle extends Handle {
    private node: TreeNode;
    constructor(node: TreeNode) {
        super(0,0);
        this.node = node
    }
    update_from_node() {
        let bd:BoundedShape = <BoundedShape>get_component(this.node, BoundedShapeName)
        this.x = bd.get_bounds().x + bd.get_bounds().w - 5
        this.y = bd.get_bounds().y + bd.get_bounds().h - 5
    }
    override moveBy(diff: Point) {
        this.x += diff.x
        this.y += diff.y
        this.update_to_node()
    }


    private update_to_node() {
        let bd:BoundedShape = <BoundedShape>get_component(this.node, BoundedShapeName)
        let bdd = bd.get_bounds()
        bdd.w = this.x - bdd.x + this.w/2
        bdd.h = this.y - bdd.y + this.h/2
    }
}

export class ResizableRectObject implements Resizable {
    private handle: RectHandle;
    name: string;
    private node: TreeNode;
    constructor(node:TreeNode) {
        this.node = node
        this.name = ResizableName
        this.handle = new RectHandle(this.node)
    }
    get_handle(): Handle {
        this.handle.update_from_node()
        return this.handle
    }
}

function LABEL(text: string) {
    return ELEM('label',[],[text])
}

function NUMBER_INPUT(value: number, cb: (v) => void) {
    let input = document.createElement('input')
    input.setAttribute('type','number')
    input.setAttribute('value',value+"")
    input.addEventListener('change',(e)=>{
        let el:HTMLInputElement = <HTMLInputElement>e.target
        if(!Number.isNaN(el.valueAsNumber)) cb(el.valueAsNumber)
    })
    return input
}

export class RectPropRendererSystem implements PropRenderingSystem {
    name: string;
    private state: GlobalState;
    constructor(state:GlobalState) {
        this.state = state
    }

    render_view(comp: Component): HTMLElement {
        let bounds = (comp as BoundedShape).get_bounds()
        let x = LABEL("x")
        let xbox = NUMBER_INPUT(bounds.x,(v)=>{
            bounds.x = v
            this.state.dispatch("refresh", {})
        })
        let y = LABEL("y")
        let ybox = NUMBER_INPUT(bounds.x,(v)=>{
            bounds.y = v
            this.state.dispatch("refresh", {})
        })
        let w = LABEL("w")
        let wbox = NUMBER_INPUT(bounds.x,(v)=>{
            bounds.w = v
            this.state.dispatch("refresh", {})
        })
        let h = LABEL("h")
        let hbox = NUMBER_INPUT(bounds.x,(v)=>{
            bounds.h = v
            this.state.dispatch("refresh", {})
        })
        return DIV(["prop-group"],[x,xbox,y,ybox,w,wbox,h,hbox])
    }

    supports(name: string): any {
        if(name === BoundedShapeName) return true
        return false
    }

}
