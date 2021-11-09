import {
    Component,
    FilledShape,
    FilledShapeName,
    FilledShapeObject,
    forceDownloadBlob,
    TreeNode,
    TreeNodeImpl
} from "../common.js";
import {GlobalState} from "../state.js";

export interface JSONExporter extends Component {
    canHandleToJSON(comp:any, node:TreeNode):boolean
    canHandleFromJSON(obj:any, node:TreeNode):boolean
    toJSON(component:Component,node:TreeNode):any
    fromJSON(obj:any,node:TreeNode):Component
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
                let exp = state.jsonexporters.find(exp => exp.canHandleToJSON(comp,root))
                // if(!exp) throw new Error(`cannot export component ${comp.name}`)
                if(!exp) console.warn(`cannot export component ${comp.name}`)
                if(exp) return exp.toJSON(comp,root)
                return {missing:true, name:comp.name}
            }).filter(o => o !== null)
            return
        }

        obj[key] = root[key]
    })
    return obj
}

export function POJO_to_treenode(obj: any, state: GlobalState):TreeNode {
    console.log("obj is",obj)
    let node = new TreeNodeImpl()
    node.id = obj.id
    node.children = obj.children.map(ch => {
        return POJO_to_treenode(ch,state)
    })
    node.components = obj.components.map(comp => {
        console.log("comp is",comp)
        let exp = state.jsonexporters.find(exp => exp.canHandleFromJSON(comp,node))
        if(exp) return exp.fromJSON(comp,node)
        console.warn(`cannot import component ${comp.name}`)
    })
    return node
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


    toJSON(component: Component): any {
        let filled = component as FilledShape
        return {
            name:filled.name,
            color:filled.get_color()
        }
    }

    fromJSON(obj: any): Component {
        return new FilledShapeObject(obj.color)
    }

    canHandleFromJSON(obj: any, node: TreeNode): boolean {
        return obj.name === FilledShapeName
    }

    canHandleToJSON(comp: any, node: TreeNode): boolean {
        return comp.name === FilledShapeName
    }

}
