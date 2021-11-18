/*
for proper group support the canvas and pickers need to be more aware of groups.

The root should have a special type to indicate it's the top.
the canvas should delegate to a group renderer to draw the children. It shouldn't infinitely recurse
on it's own. Or should it? Maybe just ask for a transform from the group instead?.

for picking we skip the root
for each child we find a picker to support it, then ask the picker if that node is picked, includes
a coordinate offset.

picker api is  is_picked(treenode,point)

BoundedShapePickSystem returns true if node has bounded shape and point inside the shape
circle pick system returns true if node has circle shape and point inside
same for text and spiral

group pick system returns true if any of the children are inside the



 */
import {
    Component,
    Movable, MovableName, ParentTranslate, ParentTranslateName,
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

export class GroupParentTranslate implements ParentTranslate {
    private group: TreeNodeImpl;
    constructor(group1: TreeNodeImpl) {
        this.group = group1
        this.name = ParentTranslateName
    }
    name: string;
    get_translation_point(): Point {
        return (this.group.get_component(GroupShapeName) as GroupShape).get_position()
    }
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
        let rect = new Rect(0,0,0,0).makeEmpty()
        this.node.children.forEach(ch => {
            if(ch.has_component(BoundedShapeName)) {
                let bds = ch.get_component(BoundedShapeName) as BoundedShape
                rect = rect.add(bds.get_bounds())
            }
        })
        return rect.translate(this.position)
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
    pick_node(pt: Point, node: TreeNode): boolean {
        if(node.has_component(GroupShapeName)) {
            let group:GroupShape = node.get_component(GroupShapeName) as GroupShape
            let rect:Rect = group.get_child_bounds()
            if(rect.contains(pt)) return true
        }
        return false;
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
