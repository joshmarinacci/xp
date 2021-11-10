import {
    Component, DIV,
    FilledShape,
    FilledShapeName, LABEL, Movable, MovableName, NUMBER_INPUT, PickingSystem, Point,
    Powerup, PropRenderingSystem,
    RenderingSystem,
    TreeNode
} from "./common.js";
import {GlobalState} from "./state.js";
import {JSONExporter} from "./exporters/json.js";

const SpiralShapeName = "SpiralShape"
export class SpiralShapeObject implements Component {
    private radius: number;
    private pos: Point;
    constructor(pos:Point, radius: number) {
        this.pos = pos
        this.radius = radius
        this.name = SpiralShapeName
    }
    name: string;
    get_radius() {
        return this.radius
    }
    set_radius(radius:number):void {
        this.radius = radius
    }
    get_position(): Point {
        return this.pos
    }
}

export class SpiralPropRendererSystem implements PropRenderingSystem {
    name: string;
    private state: GlobalState;
    constructor(state:GlobalState) {
        this.state = state
    }

    render_view(comp: Component): HTMLElement {
        let shape = (comp as SpiralShapeObject)
        let x = LABEL("x")
        let xbox = NUMBER_INPUT(shape.get_position().x,(v)=>{
            shape.get_position().x = v
            this.state.dispatch("refresh", {})
        })
        let y = LABEL("y")
        let ybox = NUMBER_INPUT(shape.get_position().y,(v)=>{
            shape.get_position().y = v
            this.state.dispatch("refresh", {})
        })
        let r = LABEL("radius")
        let rbox = NUMBER_INPUT(shape.get_radius(),(v)=>{
            shape.set_radius(v)
            this.state.dispatch("refresh", {})
        })
        return DIV(["prop-group"],[x,xbox,y,ybox,r,rbox])
    }

    supports(name: string): any {
        if(name === SpiralShapeName) return true
        return false
    }

}

class SpiralRendererSystem implements RenderingSystem {
    name: string;

    render(ctx: CanvasRenderingContext2D, node: TreeNode, state: GlobalState): void {
        if(node.has_component(SpiralShapeName)) {
            let spiral:SpiralShapeObject = <SpiralShapeObject>node.get_component(SpiralShapeName)
            let times = 5*Math.PI*2
            let radius = spiral.get_radius() / times

            ctx.save()
            ctx.translate(spiral.get_position().x,spiral.get_position().y)
            if (node.has_component(FilledShapeName)) {
                let color: FilledShape = <FilledShape>node.get_component(FilledShapeName)
                ctx.strokeStyle = color.get_color()
                ctx.lineWidth = 1
            }
            for(let th=0; th<times; th+=0.1) {
                let x = Math.sin(th)*radius*th
                let y = Math.cos(th)*radius*th
                if(th === 0) {
                    ctx.moveTo(x,y)
                } else {
                    ctx.lineTo(x,y)
                }
            }
            ctx.stroke()
            ctx.restore()
        }
    }

}
const SpiralPickSystemName = 'SpiralPickSystemName';
export class SpiralPickSystem implements PickingSystem {
    name: string;
    constructor() {
        this.name = SpiralPickSystemName
    }

    pick(pt: Point, state: GlobalState): TreeNode[] {
        let picked = []
        this._test_node(pt,state.get_root(),picked)
        return picked
    }

    private _test_node(pt:Point, node: TreeNode, collect:TreeNode[]) {
        if(node.has_component(SpiralShapeName)) {
            let circle = (<SpiralShapeObject> node.get_component(SpiralShapeName))
            let dist = circle.get_position().subtract(pt)
            if(dist.magnitude() < circle.get_radius()) {
                collect.push(node)
            }
        }
        node.children.forEach((ch:TreeNode) => {
            this._test_node(pt,ch,collect)
        })
    }
}

export class MovableSpiralObject implements Movable {
    name: string;
    private readonly node: TreeNode;
    constructor(node:TreeNode) {
        this.node = node
        this.name = MovableName
    }
    moveBy(pt: Point): void {
        let shape:SpiralShapeObject = <SpiralShapeObject>this.node.get_component(SpiralShapeName)
        shape.get_position().x += pt.x
        shape.get_position().y += pt.y
    }
}


class SpiralJSONExporter implements JSONExporter {
    name: string;
    private powerup: string;
    constructor() {
        this.powerup = 'spiral'
    }

    canHandleFromJSON(obj: any, node: TreeNode): boolean {
        if(obj.name === SpiralShapeName) return true
        if(obj.name === MovableName) return true
        return false
    }

    canHandleToJSON(comp: any, node: TreeNode): boolean {
        if(comp.name === SpiralShapeName) return true
        if(comp.name === MovableName && node.has_component(SpiralShapeName)) return true
        return false;
    }

    fromJSON(obj: any, node: TreeNode): Component {
        if(obj.name === MovableName) return new MovableSpiralObject(node)
        if(obj.name === SpiralShapeName) return new SpiralShapeObject((new Point(0,0)).from_object(obj.position),obj.radius)
    }

    toJSON(component: Component, node: TreeNode): any {
        if(component.name === MovableName) return {name:component.name, empty:true, powerup:this.powerup}
        if(component.name === SpiralShapeName) {
            let shape = component as SpiralShapeObject
            return {
                name: shape.name,
                position: shape.get_position(),
                radius: shape.get_radius(),
            }
        }
    }
}

export class SpiralPowerup implements Powerup {
    init(state: GlobalState) {
        state.props_renderers.push(new SpiralPropRendererSystem(state))
        state.pickers.push(new SpiralPickSystem())
        state.renderers.push(new SpiralRendererSystem())
        // state.svgexporters.push(new RectSVGExporter())
        // state.pdfexporters.push(new RectPDFExporter())
        state.jsonexporters.push(new SpiralJSONExporter())
    }
}
