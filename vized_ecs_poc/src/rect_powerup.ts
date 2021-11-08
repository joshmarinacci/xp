import {
    BoundedShape,
    BoundedShapeName,
    FilledShape,
    FilledShapeName,
    get_component,
    has_component, Movable, MovableName,
    PickingSystem,
    Point,
    RenderingSystem, SVGExporter,
    TreeNode
} from "./common.js";
import {GlobalState} from "./start.js";

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
