import {Component, FilledShape, FilledShapeName, forceDownloadBlob, TreeNode} from "../common.js";
import {GlobalState} from "../state.js";

export interface JSONExporter extends Component {
    canExport(component_name:string):boolean
    toJSON(component:Component):any
}

export function treenode_to_POJO(root: TreeNode, state: GlobalState) {
    let obj = {}
    Object.keys(root).forEach(key => {
        if (key === 'parent') return
        if (key === 'children') {
            obj[key] = root.children.map(ch => treenode_to_POJO(ch, state))
            return
        }
        if(key === 'components') {
            obj[key] = root.components.map(comp => {
                let exp = state.jsonexporters.find(exp => exp.canExport(comp.name))
                // if(!exp) throw new Error(`cannot export component ${comp.name}`)
                if(!exp) console.warn(`cannot export component ${comp.name}`)
                if(exp) return exp.toJSON(comp)
                return ""
            })
            return
        }

        obj[key] = root[key]
    })
    return obj
}

export function export_JSON(root: TreeNode, state:GlobalState) {
    console.log("exporting to JSON", root)
    let obj = treenode_to_POJO(root,state)
    console.log("obj is", obj)
    let str = JSON.stringify(obj, null, '  ')
    console.log(str)
    forceDownloadBlob('demo.json', new Blob([str]))
}


export class FilledShapeJSONExporter implements JSONExporter {
    name: string;

    canExport(component_name: string): boolean {
        return component_name === FilledShapeName
    }

    toJSON(component: Component): any {
        let filled = component as FilledShape
        return {
            name:filled.name,
            color:filled.get_color()
        }
    }

}
