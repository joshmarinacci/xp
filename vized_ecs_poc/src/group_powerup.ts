import {
    Component,
    Movable, MovableName,
    PickingSystem,
    Point,
    Powerup, Rect, RenderingSystem,
    TreeNode,
    TreeNodeImpl
} from "./common.js";
import {GlobalState} from "./state.js";
import {BoundedShape, BoundedShapeName} from "./bounded_shape.js";

const GroupShapeName = "GroupShapeName"
export interface GroupShape extends Component {
    get_position():Point
    get_child_bounds(): Rect;
}

export class GroupShapeObject implements GroupShape {
    name: string;
    private node: TreeNode;
    private position: Point;
    constructor(node:TreeNode, point:Point) {
        this.name = GroupShapeName
        this.node = node
        this.position = point
    }

    get_child_bounds(): Rect {
        let rect = new Rect(this.position.x,this.position.y,10, 10).makeEmpty()
        this.node.children.forEach(ch => {
            if(ch.has_component(BoundedShapeName)) {
                let bds = ch.get_component(BoundedShapeName) as BoundedShape
                rect = rect.add(bds.get_bounds())
            }
        })
        return rect
    }

    get_position(): Point {
        return this.position
    }

}

export class MovableGroupShape implements Movable {
    name: string;
    private group: TreeNodeImpl;
    constructor(group1: TreeNodeImpl) {
        this.name = MovableName
        this.group = group1
    }


    moveBy(pt: Point): void {
        let group:GroupShape = this.group.get_component(GroupShapeName) as GroupShape
        group.get_position().x += pt.x
        group.get_position().y += pt.y
    }

}

const GroupRendererSystemName = 'GroupRendererSystemName'
export class GroupRendererSystem implements RenderingSystem {
    constructor() {
        this.name = GroupRendererSystemName
    }

    render(ctx: CanvasRenderingContext2D, node: TreeNode, state: GlobalState): void {
        if (node.has_component(GroupShapeName)) {
            let group:GroupShape = node.get_component(GroupShapeName) as GroupShape
            let pos = group.get_position()
            let rect = group.get_child_bounds()
            ctx.fillStyle = 'rgba(255,0,0,0.5)'
            ctx.save()
            ctx.translate(pos.x,pos.y)
            ctx.fillRect(rect.x, rect.y, rect.w, rect.h)
            if (state.selection.has(node)) {
                ctx.strokeStyle = 'magenta'
                ctx.lineWidth = 3.5
                ctx.strokeRect(rect.x, rect.y, rect.w, rect.h)
            }
            ctx.restore()
        }
    }

    name: string;
}


const GroupPickSystemName = 'BoundedShapePickSystem';
export class GroupPickSystem implements PickingSystem {
    name: string;
    constructor() {
        this.name = GroupPickSystemName
    }

    pick(pt: Point, state: GlobalState): TreeNode[] {
        let picked = []
        this._test_node(pt, state.get_root(), picked)
        return picked
    }

    private _test_node(pt: Point, node: TreeNode, collect: any[]) {
        if(node.has_component(GroupShapeName)) {
            let group:GroupShape = node.get_component(GroupShapeName) as GroupShape
            let rect:Rect = group.get_child_bounds()
            if(rect.contains(pt)) collect.push(node)
        }
        node.children.forEach(ch => this._test_node(pt,ch,collect))

    }
}

export class GroupPowerup implements Powerup {
    init(state: GlobalState) {
        state.pickers.push(new GroupPickSystem())
        state.renderers.push(new GroupRendererSystem())
        // state.props_renderers.push(new ImagePropRendererSystem(state))
        // state.svgexporters.push(new ImageSVGExporter())
        // state.pdfexporters.push(new ImagePDFExporter())
    }
}
