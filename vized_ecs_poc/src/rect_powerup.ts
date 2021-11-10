import {
    Component,
    FilledShape,
    FilledShapeName,
    MovableName,
    PDFExporter,
    Powerup,
    Rect,
    RenderingSystem,
    ResizableName,
    SVGExporter,
    TreeNode
} from "./common.js";
import {GlobalState} from "./state.js";
import {JSONExporter} from "./exporters/json.js";
import {cssToPdfColor} from "./exporters/pdf.js";
import {
    BoundedShape,
    BoundedShapeName,
    BoundedShapeObject,
    MovableRectObject,
    RectPickSystem,
    RectPropRendererSystem,
    ResizableRectObject
} from "./bounded_shape.js";

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
        let pdf_color = cssToPdfColor(obj.fill)
        doc.setFillColor(...pdf_color)
        doc.rect(obj.x,obj.y,obj.width,obj.height,"FD")

    }

}

export class RectJsonExporter implements JSONExporter {
    name: string;

    toJSON(component: Component, node:TreeNode): any {
        if(component.name === ResizableName) return {name:component.name, empty:true, powerup:'rect'}
        if(component.name === MovableName) return {name:component.name, empty:true, powerup:'rect'}
        let bd: BoundedShape = <BoundedShape>component
        let rect = bd.get_bounds()
        let obj = {
            name:BoundedShapeName,
            x:rect.x,
            y:rect.y,
            width:rect.w,
            height:rect.h,
            powerup:'rect',
        }
        return obj
    }

    fromJSON(obj: any, node:TreeNode): Component {
        if(obj.name === ResizableName) return new ResizableRectObject(node)
        if(obj.name === MovableName) return new MovableRectObject(node)
        if(obj.name === BoundedShapeName) return new BoundedShapeObject(new Rect(obj.x,obj.y,obj.width,obj.height))
    }

    canHandleFromJSON(obj: any, node: TreeNode): boolean {
        if(obj.name === ResizableName && obj.powerup==='rect') return true
        if(obj.name === MovableName && obj.powerup==='rect') return true
        if(obj.name === BoundedShapeName && obj.powerup === 'rect') return true
    }

    canHandleToJSON(comp: any, node: TreeNode): boolean {
        if(comp.name === BoundedShapeName) return true
        if(comp.name === ResizableName && node.has_component(BoundedShapeName)) return true
        if(comp.name === MovableName && node.has_component(BoundedShapeName)) return true
        return false;
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
        state.jsonexporters.push(new RectJsonExporter())
    }
}
