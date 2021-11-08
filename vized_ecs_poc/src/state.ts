import {
    Handle,
    PickingSystem,
    RenderingSystem,
    SelectionSystem,
    SVGExporter,
    TreeNode
} from "./common.js";

type Callback = (any) => void

export class GlobalState {
    systems: any[]
    renderers: RenderingSystem[]
    svgexporters: SVGExporter[]
    selection: SelectionSystem
    pickers: PickingSystem[]
    private root: TreeNode;
    private listeners: Map<string, Callback[]>
    active_handles: Handle[];

    constructor() {
        this.systems = []
        this.renderers = []
        this.pickers = []
        this.svgexporters = []
        this.selection = new SelectionSystem()
        this.active_handles = []
        this.listeners = new Map<string, Callback[]>()
    }

    lookup_treenode(id: string): TreeNode {
        return this.search_treenode_by_id(this.root, id)
    }

    set_root(tree: TreeNode) {
        this.root = tree
    }

    private search_treenode_by_id(root: TreeNode, id: string): TreeNode {
        if (root.id === id) return root
        for (let ch of root.children) {
            let ret = this.search_treenode_by_id(ch, id)
            if (ret) return ret
        }
        return undefined
    }

    on(type: string, cb: Callback) {
        this._get_listeners(type).push(cb)
    }

    private _get_listeners(type: string) {
        if (!this.listeners.has(type)) this.listeners.set(type, [])
        return this.listeners.get(type)
    }

    dispatch(type: string, payload: any) {
        // this.log("dispatching",type,payload)
        this._get_listeners(type).forEach(cb => cb(payload))
    }

    private log(...args) {
        console.log("GLOBAL:", ...args)
    }

    get_root(): TreeNode {
        return this.root
    }
}
