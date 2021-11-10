import {BoundedShape, BoundedShapeName, TreeNode} from "../common.js";
import {GlobalState} from "../state.js";
// @ts-ignore
const { jsPDF } = window.jspdf;

function treenode_to_PDF(node: TreeNode, state: GlobalState,doc:any) {
    let exp = state.pdfexporters.find(exp => exp.canExport(node))
    return exp ? exp.toPDF(node,doc) : ""
}

export function export_PDF(root:TreeNode, state:GlobalState) {
    let bds = {
        w:500,
        h:500,
    }
    if(root.has_component(BoundedShapeName)) {
        let bounds = root.get_component(BoundedShapeName) as BoundedShape
        let rect = bounds.get_bounds()
        bds.w = rect.w
        bds.h = rect.h
    }
    let doc = new jsPDF({
        unit:'pt',
        format:[bds.w,bds.h],
    })
    root.children.forEach(ch => treenode_to_PDF(ch, state,doc))
    doc.save("a4.pdf");
}
