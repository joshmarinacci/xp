import {
    Component,
    FilledShape, FilledShapeName,
    get_component,
    has_component, Point,
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
            if(state.selection.has(node)) {
                ctx.strokeStyle = 'magenta'
                ctx.lineWidth = 3.5
                ctx.stroke()
            }

        }
    }

}
