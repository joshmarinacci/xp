import {TreeNode} from "../common.js";
import {GlobalState} from "../state.js";
// @ts-ignore
const { jsPDF } = window.jspdf;

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
function treenode_to_PDF(node: TreeNode, state: GlobalState,doc:any) {
    let exp = state.pdfexporters.find(exp => exp.canExport(node))
    return exp ? exp.toPDF(node,doc) : ""
}

export function export_PDF(root:TreeNode, state:GlobalState) {
    let doc = new jsPDF({
        unit:'pt'
    })
    root.children.forEach(ch => treenode_to_PDF(ch, state,doc))
    doc.save("a4.pdf");
}
