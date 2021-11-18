import {Component, System, TreeNode} from "../common.js";
import {GlobalState} from "../state.js";
import {BoundedShape, BoundedShapeName} from "../bounded_shape.js";
// @ts-ignore
const { jsPDF } = window.jspdf;


export interface PDFExporter extends System {
    canExport(node:TreeNode):boolean
    toPDF(node:TreeNode, state:GlobalState, doc:any, scale:number):void
}

const PDFExportBoundsName = "PDFExportBoundsName"
export class PDFExportBounds implements Component {
    unit: string;
    scale: number;
    constructor(inch: string, scale: number) {
        this.name = PDFExportBoundsName
        this.unit = inch
        this.scale = scale
    }
    name: string;
}

export function cssToPdfColor(color:string):number[] {
    console.log(`converting color: ${color}`)
    if(!color.startsWith('#')) {
        console.error(`we can't convert color ${color}`)
        return [0,0,0]
    }

    let hex = Number.parseInt(color.substring(1),16)
    let r = (hex>>16)&(0xFF)
    let g = (hex>>8)&(0xFF)
    let b = (hex>>0)&(0xFF)
    let arr = [r,g,b]
    console.info("generated color array",arr)
    return arr
}
export function treenode_to_PDF(node: TreeNode, state: GlobalState,doc:any, scale:number) {
    let exp = state.pdfexporters.find(exp => exp.canExport(node))
    return exp ? exp.toPDF(node,state,doc,scale) : ""
}

export function export_PDF(root:TreeNode, state:GlobalState) {
    let bds = {
        w:500,
        h:500,
    }
    let scale = 1
    if(root.has_component(BoundedShapeName)) {
        let bounds = root.get_component(BoundedShapeName) as BoundedShape
        let rect = bounds.get_bounds()
        bds.w = rect.w
        bds.h = rect.h
    }
    let settings = {
        unit:'pt',
        format:[bds.w,bds.h],
    }
    if(root.has_component(PDFExportBoundsName)) {
        let pdb = root.get_component(PDFExportBoundsName) as PDFExportBounds
        console.log('pdb',pdb)
        settings.unit = pdb.unit
        settings.format = [bds.w*pdb.scale,bds.h*pdb.scale]
        scale = pdb.scale
    }
    console.log("using the settings",settings)
    let doc = new jsPDF(settings)
    root.children.forEach(ch => treenode_to_PDF(ch, state,doc,scale))
    doc.save("output.pdf");
}
