import {
    Component,
    Handle,
    Point, Powerup,
    RenderingSystem, Resizable, ResizableName,
    TreeNode
} from "./common.js"
import {GlobalState} from "./state.js";
import {BoundedShape, BoundedShapeName} from "./bounded_shape.js";

const ImageShapeName = "ImageShapeName"
export interface ImageShape extends Component {
    get_aspect_ratio():number
}

export class ImageShapeObject implements ImageShape {
    name: string;
    private url: any;
    private ow: any;
    private oh: any;
    dom_image: HTMLImageElement;
    aspect_ratio: number;
    constructor(url,w,h) {
        this.name = ImageShapeName
        this.url = url
        this.ow = w
        this.oh = h
        this.aspect_ratio = w/h
        this.dom_image = new Image()
        this.dom_image.addEventListener('load',()=>{
            console.log("image loaded",this.dom_image)
        })
        this.dom_image.src = this.url
    }

    get_aspect_ratio(): number {
        return this.aspect_ratio;
    }
}
export class ImageShapeHandle extends Handle {
    private node: TreeNode;
    constructor(node:TreeNode) {
        super(0,0);
        this.node = node
    }
    override moveBy(diff: Point) {
        this.x += diff.x
        this.y += diff.y
        this.update_to_node()
    }
    update_from_node() {
        let bd: BoundedShape = this.node.get_component(BoundedShapeName) as BoundedShape
        this.x = bd.get_bounds().x + bd.get_bounds().w - 5
        this.y = bd.get_bounds().y + bd.get_bounds().h - 5
    }

    private update_to_node() {
        let bd: BoundedShape = this.node.get_component(BoundedShapeName) as BoundedShape
        let bdd = bd.get_bounds()
        bdd.w = this.x - bdd.x + this.w / 2
        bdd.h = this.y - bdd.y + this.h / 2
        let img = this.node.get_component(ImageShapeName) as ImageShape
        let rat = img.get_aspect_ratio()
        bdd.h = bdd.w*rat
    }
}

export class ResizableImageObject implements Resizable {
    name: string;
    private node: TreeNode;
    private handle: ImageShapeHandle;
    constructor(node:TreeNode) {
        this.node = node
        this.name = ResizableName
        this.handle = new ImageShapeHandle(this.node)
    }

    get_handle(): Handle {
        this.handle.update_from_node()
        return this.handle
    }

}

const ImageRendererSystemName = 'ImageRendererSystemName'
export class ImageRendererSystem implements RenderingSystem {
    constructor() {
        this.name = ImageRendererSystemName
    }

    render(ctx: CanvasRenderingContext2D, node: TreeNode, state: GlobalState): void {
        if (node.has_component(BoundedShapeName) && node.has_component(ImageShapeName)) {
            let bd: BoundedShape = <BoundedShape>node.get_component(BoundedShapeName)
            let rect = bd.get_bounds()

            let img:ImageShapeObject = node.get_component(ImageShapeName) as ImageShapeObject
            ctx.fillStyle = 'magenta'
            ctx.fillRect(rect.x, rect.y, rect.w, rect.h)
            ctx.drawImage(img.dom_image,rect.x,rect.y,rect.w,rect.h)
            // console.log('aspect ratio',img.aspect_ratio)
            if (state.selection.has(node)) {
                ctx.strokeStyle = 'magenta'
                ctx.lineWidth = 3.5
                ctx.strokeRect(rect.x, rect.y, rect.w, rect.h)
            }
        }
    }

    name: string;
}




export class ImagePowerup implements Powerup {
    init(state: GlobalState) {
        state.renderers.push(new ImageRendererSystem())
        // state.svgexporters.push(new RectSVGExporter())
        // state.pdfexporters.push(new RectPDFExporter())
        // state.jsonexporters.push(new RectJsonExporter())
    }
}
