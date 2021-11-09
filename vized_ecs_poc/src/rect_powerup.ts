import {
    BoundedShape,
    BoundedShapeName,
    Component,
    DIV,
    FilledShape,
    FilledShapeName,
    Handle,
    LABEL,
    Movable,
    MovableName,
    NUMBER_INPUT,
    PDFExporter,
    PickingSystem,
    Point, Powerup,
    PropRenderingSystem,
    RenderingSystem,
    Resizable,
    ResizableName,
    SVGExporter,
    TreeNode
} from "./common.js";
import {GlobalState} from "./state.js";

const RectRendererSystemName = 'RectRendererSystemName'

export class RectRendererSystem implements RenderingSystem {
    constructor() {
        this.name = RectRendererSystemName
    }

    render(ctx: CanvasRenderingContext2D, node: TreeNode, state: GlobalState): void {
        if (node.has_component(BoundedShapeName)) {
            let bd: BoundedShape = <BoundedShape>node.get_component(BoundedShapeName)
            let rect = bd.get_bounds()

            if (node.has_component(FilledShapeName)) {
                let color: FilledShape = <FilledShape>node.get_component(FilledShapeName)
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
        if (node.has_component(BoundedShapeName)) {
            let rect = (<BoundedShape>node.get_component(BoundedShapeName)).get_bounds()
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
        return node.has_component(BoundedShapeName)
    }

    toSVG(node: TreeNode): string {
        let bd: BoundedShape = <BoundedShape>node.get_component(BoundedShapeName)
        let rect = bd.get_bounds()
        let color: FilledShape = <FilledShape>node.get_component(FilledShapeName)
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

export class RectPDFExporter implements PDFExporter {
    name: string;

    canExport(node: TreeNode): boolean {
        return node.has_component(BoundedShapeName)
    }

    toPDF(node: TreeNode, doc: any): void {
        let bd: BoundedShape = <BoundedShape>node.get_component(BoundedShapeName)
        let rect = bd.get_bounds()
        let color: FilledShape = <FilledShape>node.get_component(FilledShapeName)
        let obj = {
            x:rect.x,
            y:rect.y,
            width:rect.w,
            height:rect.w,
            fill:color.get_color()
        }
        doc.setFillColor(255, 0, 0);
        doc.rect(obj.x,obj.y,obj.width,obj.height,"FD")

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
        let bd:BoundedShape = <BoundedShape>this.node.get_component(BoundedShapeName)
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
        let bd:BoundedShape = <BoundedShape>this.node.get_component(BoundedShapeName)
        this.x = bd.get_bounds().x + bd.get_bounds().w - 5
        this.y = bd.get_bounds().y + bd.get_bounds().h - 5
    }
    override moveBy(diff: Point) {
        this.x += diff.x
        this.y += diff.y
        this.update_to_node()
    }


    private update_to_node() {
        let bd:BoundedShape = <BoundedShape>this.node.get_component(BoundedShapeName)
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
            this.state.dispatch("prop-change", {})
        })
        let y = LABEL("y")
        let ybox = NUMBER_INPUT(bounds.y,(v)=>{
            bounds.y = v
            this.state.dispatch("prop-change", {})
        })
        let w = LABEL("w")
        let wbox = NUMBER_INPUT(bounds.w,(v)=>{
            bounds.w = v
            this.state.dispatch("prop-change", {})
        })
        let h = LABEL("h")
        let hbox = NUMBER_INPUT(bounds.h,(v)=>{
            bounds.h = v
            this.state.dispatch("prop-change", {})
        })
        return DIV(["prop-group"],[x,xbox,y,ybox,w,wbox,h,hbox])
    }

    supports(name: string): any {
        if(name === BoundedShapeName) return true
        return false
    }

}

export class RectPowerup implements Powerup {
    init(state: GlobalState) {
        state.props_renderers.push(new RectPropRendererSystem(state))
        state.pickers.push(new RectPickSystem())
        state.renderers.push(new RectRendererSystem())
        state.props_renderers.push(new RectPropRendererSystem(state))
        state.svgexporters.push(new RectSVGExporter())
        state.pdfexporters.push(new RectPDFExporter())
    }
}
