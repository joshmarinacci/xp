import {
    BoundedShape,
    BoundedShapeName,
    Component,
    FilledShape, FilledShapeName,
    get_component,
    has_component, Movable, MovableName, PickingSystem, Point,
    RenderingSystem,
    TreeNode
} from "./common.js";
import {
    GlobalState
} from "./start.js";

const CircleShapeName = "CircleShapeName"
export interface CircleShape extends Component {
    get_position():Point
    get_radius():number
}
export class CircleShapeObject implements CircleShape {
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

export const CircleRendererSystemName = 'CircleRendererSystemName'
export class CircleRendererSystem implements RenderingSystem {
    name: string

    constructor() {
        this.name = CircleRendererSystemName
    }

    render(ctx: CanvasRenderingContext2D, node: TreeNode, state:GlobalState): void {
        if(has_component(node,CircleShapeName)) {
            let shape:CircleShape = <CircleShape>get_component(node, CircleShapeName)
            if(has_component(node,FilledShapeName)) {
                let color: FilledShape = <FilledShape>get_component(node, FilledShapeName)
                ctx.fillStyle = color.get_color()
            } else {
                ctx.fillStyle = 'magenta'
            }
            ctx.beginPath()
            ctx.arc(shape.get_position().x, shape.get_position().y,shape.get_radius(),0,Math.PI*2)
            ctx.fill()
            if(state.selection.has(node)) {
                ctx.strokeStyle = 'magenta'
                ctx.lineWidth = 3.5
                ctx.stroke()
            }

        }
    }

}


const CirclePickSystemName = 'CirclePickSystemName';
export class CirclePickSystem implements PickingSystem {
    name: string;
    constructor() {
        this.name = CirclePickSystemName
    }

    pick(pt: Point, state: GlobalState): TreeNode[] {
        let picked = []
        this._test_node(pt,state.get_root(),picked)
        return picked
    }

    private _test_node(pt:Point, node: TreeNode, collect:TreeNode[]) {
        if(has_component(node,CircleShapeName)) {
            let circle = (<CircleShape> get_component(node,CircleShapeName))
            let dist = circle.get_position().subtract(pt)
            console.log("distance is",dist)
            if(dist.magnitude() < circle.get_radius()) {
                collect.push(node)
            }
            // if(circl.contains(pt)) collect.push(node)
        }
        node.children.forEach((ch:TreeNode) => {
            this._test_node(pt,ch,collect)
        })
    }
}


export class MovableCircleObject implements Movable {
    name: string;
    private readonly node: TreeNode;
    constructor(node:TreeNode) {
        this.node = node
        this.name = MovableName
    }
    moveBy(pt: Point): void {
        let circle:CircleShape = <CircleShape>get_component(this.node, CircleShapeName)
        circle.get_position().x += pt.x
        circle.get_position().y += pt.y
    }
}
