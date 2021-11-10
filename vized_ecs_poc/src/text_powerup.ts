import {
    BoundedShape,
    BoundedShapeName, CHOICE_INPUT,
    Component, DIV, LABEL, Movable, MovableName, NUMBER_INPUT,
    PickingSystem,
    Point,
    Powerup, PropRenderingSystem,
    RenderingSystem, STRING_INPUT,
    TreeNode
} from "./common.js";
import {GlobalState} from "./state.js";

const TextShapeName = "TextShapeName"
interface TextShape extends Component {
    get_content():string
    set_content(content:string):void
    get_fontsize():number
    set_fontsize(size:number):void
    get_halign(): string;
    set_halign(halign:string): void;
    get_valign(): string;
    set_valign(valign:string):void
}

export class TextShapeObject implements TextShape {
    name: string;
    private content: string;
    private fontsize: number;
    private halign: string;
    private valign: string;
    constructor(content:string, size:number, halign:string, valign:string) {
        this.name = TextShapeName
        this.content = content
        this.fontsize = size
        this.halign = halign
        this.valign = valign
    }

    get_valign(): string {
        return this.valign
    }
    set_valign(valign: string): void {
        this.valign = valign
    }

    get_content(): string {
        return this.content
    }

    get_fontsize(): number {
        return this.fontsize
    }

    set_content(content: string): void {
        this.content = content
    }

    set_fontsize(size: number): void {
        this.fontsize = size
    }

    get_halign(): string {
        return this.halign
    }

    set_halign(halign: string): void {
        this.halign = halign
    }
}


class TextRenderingSystem implements RenderingSystem {
    name: string;

    render(ctx: CanvasRenderingContext2D, node: TreeNode, state: GlobalState): void {
        if(node.has_component(TextShapeName) && node.has_component(BoundedShapeName)) {
            ctx.save()
            let bs = node.get_component(BoundedShapeName) as BoundedShape
            let tn = node.get_component(TextShapeName) as TextShape

            let bounds = bs.get_bounds()
            ctx.translate(bounds.x, bounds.y)
            ctx.fillStyle = 'black'
            ctx.font = `${tn.get_fontsize()}pt sans-serif`
            let metrics = ctx.measureText(tn.get_content())
            // console.log("metrics are",metrics)
            let h_offset = 0
            if(tn.get_halign() === "right") {
                h_offset = bounds.w - metrics.width
            }
            if(tn.get_halign() === "center") {
                h_offset = (bounds.w - metrics.width)/2
            }
            let v_offset = 0
            if(tn.get_valign() === 'top') {
                v_offset = metrics.actualBoundingBoxAscent
            }
            if(tn.get_valign() === 'center') {
                v_offset = (bounds.h - (metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent)) /2 + metrics.actualBoundingBoxAscent
            }
            if(tn.get_valign() === 'bottom') {
                v_offset = (bounds.h - (metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent)) + metrics.actualBoundingBoxAscent
            }
            ctx.fillText(tn.get_content(),h_offset,v_offset )
            ctx.restore()
        }
    }

}

export class MovableTextObject implements Movable {
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

export class TextPropRendererSystem implements PropRenderingSystem {
    name: string;
    private state: GlobalState;
    constructor(state:GlobalState) {
        this.state = state
    }

    render_view(comp: Component): HTMLElement {
        let tn = (comp as TextShape)
        let content_label = LABEL("content")
        let content_input = STRING_INPUT(tn.get_content(),(v)=>{
            tn.set_content(v)
            this.state.dispatch("prop-change", {})
        })
        let font_size_label = LABEL("fontsize")
        let font_size_input = NUMBER_INPUT(tn.get_fontsize(),(v)=>{
            tn.set_fontsize(v)
            this.state.dispatch("prop-change", {})
        })
        let halign_label = LABEL("halign")
        let halign_input = CHOICE_INPUT(tn.get_halign(),['left','center','right'],(v)=>{
            tn.set_halign(v)
            this.state.dispatch("prop-change", {})
        })
        let valign_label = LABEL("valign")
        let valign_input = CHOICE_INPUT(tn.get_valign(),['top','center','bottom'],(v)=>{
            tn.set_valign(v)
            this.state.dispatch("prop-change", {})
        })
        return DIV(["prop-group"],[content_label,content_input,font_size_label,font_size_input,halign_label,halign_input,valign_label,valign_input])
    }

    supports(name: string): any {
        if(name === TextShapeName) return true
        return false
    }

}


export class TextPowerup implements Powerup {
    init(state: GlobalState) {
        state.props_renderers.push(new TextPropRendererSystem(state))
        state.renderers.push(new TextRenderingSystem())
        // state.svgexporters.push(new TextSVGExporter())
        // state.pdfexporters.push(new TextPDFExporter())
        // state.jsonexporters.push(new CircleShapeJSONExporter())
    }

}
