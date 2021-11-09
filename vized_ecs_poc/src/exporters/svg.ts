import {forceDownloadBlob, TreeNode} from "../common.js";
import {GlobalState} from "../state.js";

function treenode_to_SVG(node: TreeNode, state: GlobalState) {
    let exp = state.svgexporters.find(exp => exp.canExport(node))
    return exp ? exp.toSVG(node) : ""
}

export function export_SVG(root: TreeNode, state: GlobalState) {
    console.log("exporting to SVG", root)
    let chs = root.children.map(ch => treenode_to_SVG(ch, state))
    let template = `<?xml version="1.0" standalone="no"?>
    <svg width="400" height="400" version="1.1" xmlns="http://www.w3.org/2000/svg">
    ${chs.join("\n")}
    </svg>
    `
    console.log("template output", template)
    let blog = new Blob([template.toString()])
    forceDownloadBlob('demo.svg', blog)
}
