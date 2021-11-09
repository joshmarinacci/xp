import {TreeNode} from "../common.js";

function treenode_to_POJO(root: TreeNode) {
    let obj = {}
    Object.keys(root).forEach(key => {
        if (key === 'parent') return
        if (key === 'children') {
            obj[key] = root.children.map(ch => treenode_to_POJO(ch))
            return
        }
        obj[key] = root[key]
    })
    return obj
}

export function export_JSON(root: TreeNode) {
    console.log("exporting to JSON", root)
    let obj = treenode_to_POJO(root)
    console.log("obj is", obj)
    let str = JSON.stringify(obj, null, '  ')
    console.log(str)
}
