import {
    range,
    add,
    divide,
    KList,
    makeBinOp,
    multiply,
    subtract,
    zip,
    KRect
} from './libs_js/common.js'
import {checkEqual} from './util.js'

function test(res,ans) {
    console.log("comparing",res,ans)
    if(!checkEqual(res,ans)) throw new Error("not equal")
}

async function list_tests() {
    //the range function
    test(range(3), new KList(0, 1, 2))
    test(range(0,3), new KList(0,1,2))
    test(range(1,3), new KList(1,2))
    test(range(0,11,5), new KList(0,5,10))

    // add two lists
    test(add(new KList(0, 1, 2), new KList(5, 6, 7)), new KList(5, 7, 9))
    test(subtract(new KList(0, 1, 2), new KList(5, 6, 7)), new KList(-5, -5, -5))
    test(multiply(new KList(0, 1, 2), new KList(5, 6, 7)), new KList(0, 6, 14))
    test(divide(new KList(0, 1, 2), new KList(5, 6, 7)), new KList(0, 1/6, 2/7))

    test(zip(new KList(0,1,2), new KList(3,2,1)), new KList(new KList(0,3),new KList(1,2),new KList(2,1)))
    test(zip(new KList(0,1,2), new KList(3,2,1)).map(l=>l.get(0)+l.get(1)), new KList(3,3,3))

    //make our own add and subtract functions that work on anything
    const add_lists = makeBinOp((a,b) => a+b)
    const sub_lists = makeBinOp((a,b) => a-b)

    test(add_lists(new KList(0,1,2), new KList(3,2,1)), new KList(3,3,3))
    test(sub_lists(new KList(0,1,2), new KList(3,2,1)), new KList(-3,-1,1))
    test(add_lists(5,new KList(0,1,2)), new KList(5,6,7))
    test(add_lists(new KList(0,1,2),5), new KList(5,6,7))

}

async function math_tests() {
    test(rando('foo').randf(),0.005)
    test(rando('bar').randf(),0.158)
    test(sine1(0),0.5)
    test(sine1(Math.PI/2),1)
    test(sine1(Math.PI),0.5)
}

class MDView {
    constructor(array, def) {
        // console.log("making a slice view",array,def)
        this.array = array
        this.fakeShape=def
        this.realShape = []
        def.forEach((d,i) => {
            // console.log("term",d)
            if(d !== null) {
                this.realShape.push(this.array.shape[i])
            }
        })
        // this.rank = 0
        this.rank = this.fakeShape.filter( t => t !== null).length
        // for(let n=0; n<this.fakeShape.length; n++) {
        //     if(this.fakeShape[n] != null) this.rank++
        // }
        // console.log("slice",this.rank,this.realShape,this.toJSFlatArray())
    }
    get1(n) {
        // console.log("getting from shape",this.shape, this.realShape)
        if(this.fakeShape[0]!== null && this.fakeShape[1] === null) {
            let i = this.fakeShape[0]
            return this.array.get2(i,n)
        }
    }

    set1(n,v) {
        // console.log('setting from view',this.shape,this.realShape, 'to parrent array',this.array.shape)
        if(this.fakeShape[0]!== null && this.fakeShape[1] === null) {
            let i = this.fakeShape[0]
            let j = n
            this.array.set2(i, j, v)
        }
    }

    toJSFlatArray() {
        // console.log("shape is",this.shape)
        let out = []
        if(this.fakeShape[0]===null && this.fakeShape[1] !== null){
            let i = this.fakeShape[1]
            for(let j=0; j<this.array.shape[0]; j++) {
                out.push(this.array.get2(i,j))
            }
        }
        if(this.fakeShape[0]!== null && this.fakeShape[1] === null) {
            let i = this.fakeShape[0]
            for(let j=0; j<this.array.shape[1]; j++) {
                // let n = this.array.index(i,j)
                // console.log("n is",this.array.get2(i,j))
                out.push(this.array.get2(i,j))
            }
        }
        return out
    }

}

class MDArray {
    constructor(...args) {
        // console.log('args',args)
        let rank = args.length
        this.rank = args.length
        this.shape = args
        let internal_length = 1
        for(let i=0; i<args.length; i++) {
            internal_length *= args[i]
        }
        // console.log("internal length", internal_length)
        if(rank === 0) {
            this.data = 0
        } else {
            this.data = new Array(internal_length)
            this.data.fill(0)
        }
    }
    toJSFlatArray() {
        return this.data.slice()
    }

    set1(i, v) {
        this.data[i] = v
    }
    set2(i,j, v) {
        let n = i + j*this.shape[0]
        this.data[n] = v
    }
    index(i,j) {
        return i + j*this.shape[0]
    }

    fill(val) {
        this.data.fill(val)
    }
    get(i) {
        return this.data[i]
    }
    get1(i) {
        return this.data[i]
    }
    get2(i,j) {
        let n = i + j*this.shape[0]
        return this.data[n]
    }

    fillWith(cb) {
        for(let i=0; i<this.shape[0]; i++) {
            for (let j = 0; j < this.shape[1]; j++) {
                let n = this.index(i,j)
                this.data[n] = cb(i, j)
            }
        }
    }

    slice(def) {
        return new MDView(this, def)
    }
}

function makeBinOpMD(op) {
    return function(arr1, arr2) {
        // console.log("make bin op md",arr1,arr2)
        if(typeof arr2.rank === 'undefined') {
            // console.log('array vs scalar')
            let arr3 = new MDArray(...arr1.shape)
            for(let i=0; i<arr1.shape[0]; i++) {
                for (let j = 0; j < arr1.shape[1]; j++) {
                    let a = arr1.get2(i, j)
                    let b = arr2
                    let v = op(a,b)
                    arr3.set2(i, j, v)
                }
            }
            return arr3
        }

        if(arr1.rank !== arr2.rank) {
            throw new Error(`cannot multiply arrays of different ranks ${arr1.rank} !== ${arr2.rank}`)
        }
        // console.log("arr1 shape is",arr1)
        let nshape = arr1.shape
        if(arr1 instanceof MDView) {
            nshape = arr1.fakeShape
        }
        let arr3 = new MDArray(...nshape)
        if(arr1.rank === 1) {
            // console.log("rank 1 binop")
            for(let i=0; i<arr1.realShape[0]; i++) {
                let a = arr1.get1(i)
                let b = arr2.get1(i)
                let c= op(a,b)
                // console.log(i, ' ' ,a,b,c)
                arr3.set1(i,c)
            }
            return arr3
        }
        for(let i=0; i<arr1.shape[0]; i++) {
            for(let j=0; j<arr1.shape[1]; j++) {
                let a = arr1.get2(i,j)
                let b = arr2.get2(i,j)
                let v = op(a,b)
                arr3.set2(i,j,v)
            }
        }
        return arr3
    }
}
function makeBinOpMDAssign(op) {
    return function(arr1, arr2) {
        if(typeof arr2.rank === 'undefined') {
            if(arr1.rank === 1) {
                for(let i=0; i<arr1.realShape[0]; i++) {
                    let a = arr1.get1(i)
                    let b = arr2
                    let c= op(a,b)
                    // console.log(i, ' ' ,a,b,c)
                    arr1.set1(i,c)
                }
                return
            }
            for(let i=0; i<arr1.shape[0]; i++) {
                for (let j = 0; j < arr1.shape[1]; j++) {
                    let a = arr1.get2(i, j)
                    let b = arr2
                    let v = op(a,b)
                    // console(i,j, ' ' , a,b,v)
                    arr1.set2(i, j, v)
                }
            }
            return
        }

        if(arr1.rank !== arr2.rank) {
            throw new Error(`cannot multiply arrays of different ranks ${arr1.rank} !== ${arr2.rank}`)
        }

        for(let i=0; i<arr1.shape[0]; i++) {
            for(let j=0; j<arr1.shape[1]; j++) {
                let a = arr1.get2(i,j)
                let b = arr2.get2(i,j)
                let v = op(a,b)
                arr2.set2(i,j,v)
            }
        }
        return
    }
}
const mulMD = makeBinOpMD((a,b)=>a*b)
const addMD = makeBinOpMD((a,b)=>a+b)
const incrementMD = makeBinOpMDAssign((a,b)=>a+b)

function MDArray_fromList(data, shape) {
    let arr = new MDArray(...shape)
    arr.data = data
    return arr
}

function rangeMD(min,max,step) {
    if(typeof step === 'undefined') step = 1
    if(typeof max === 'undefined') return rangeMD(0,min)
    let data = []
    // console.log("range",min,max,step)
    for(let i=min; i<max; i+=step) {
        data.push(i)
    }
    return MDArray_fromList(data,[data.length])
}

async function mdarray_tests() {
    test(new MDArray(2).rank,1)
    test(new MDArray(2).shape,[2])
    test(new MDArray(2,2).rank,2)
    test(new MDArray(2,2).shape,[2,2])
    test(new MDArray(2,2,2).rank,3)
    test(new MDArray(2,2,2).shape,[2,2,2])

    // //the range function
    test(rangeMD(3).toJSFlatArray(),[0,1,2])
    test(rangeMD(0,3).toJSFlatArray(), [0,1,2])
    test(rangeMD(1,3).toJSFlatArray(), [1,2])
    test(rangeMD(0,11,5).toJSFlatArray(), [0,5,10])

    // // add two lists
    // test(addMD(
    //     MDArray_fromList([0,1,2],[3]),
    //     MDArray_fromList([5, 6, 7],[3])
    // ).toJSFlatArray(), [5,7,9])
    // test(subtract(new KList(0, 1, 2), new KList(5, 6, 7)), new KList(-5, -5, -5))
    // test(multiply(new KList(0, 1, 2), new KList(5, 6, 7)), new KList(0, 6, 14))
    // test(divide(new KList(0, 1, 2), new KList(5, 6, 7)), new KList(0, 1/6, 2/7))
    //
    // test(zip(new KList(0,1,2), new KList(3,2,1)), new KList(new KList(0,3),new KList(1,2),new KList(2,1)))
    // test(zip(new KList(0,1,2), new KList(3,2,1)).map(l=>l.get(0)+l.get(1)), new KList(3,3,3))
    //
    // //make our own add and subtract functions that work on anything
    // const add_lists = makeBinOp((a,b) => a+b)
    // const sub_lists = makeBinOp((a,b) => a-b)
    //
    // test(add_lists(new KList(0,1,2), new KList(3,2,1)), new KList(3,3,3))
    // test(sub_lists(new KList(0,1,2), new KList(3,2,1)), new KList(-3,-1,1))
    // test(add_lists(5,new KList(0,1,2)), new KList(5,6,7))
    // test(add_lists(new KList(0,1,2),5), new KList(5,6,7))


    {
        //set values in a 1d array
        let arr = new MDArray(4)
        test(arr.shape,[4])
        test(arr.toJSFlatArray(),[0,0,0,0])
        arr.set1(2,88)
        test(arr.toJSFlatArray(),[0,0,88,0])
    }
    {
        //set values in a 2d array
        let arr = new MDArray(3,4)
        test(arr.shape,[3,4])
        test(arr.toJSFlatArray(),[0,0,0 ,  0,0,0,  0,0,0,  0,0,0])
        arr.set2(0,0,88)
        arr.set2(2,3,88)
        test(arr.toJSFlatArray(),[88,0,0,  0,0,0,  0,0,0,  0,0,88])
    }
    {
        let arr1 = new MDArray(2,2)
        arr1.fill(5)
        let arr2 = new MDArray(2,2)
        arr2.fill(6)
        let arr3 = mulMD(arr1,arr2)
        test(arr3.toJSFlatArray(),[30,30,30,30])
    }
    {
        let arr1 = new MDArray(4,4)
        arr1.fillWith((i,j)=>i*j)
        //look at the first row
        test(arr1.slice([null,0]).toJSFlatArray(), [0,0,0,0])
        //first column
        test(arr1.slice([0,null]).toJSFlatArray(), [0,0,0,0])
        //look at the second row
        test(arr1.slice([null,1]).toJSFlatArray(), [0,1,2,3])
        //third row
        test(arr1.slice([null,2]).toJSFlatArray(), [0,2,4,6])
        //fourth row
        test(arr1.slice([null,3]).toJSFlatArray(), [0,3,6,9])
    }
    {
        //scalar times 2d
        //3x3 array
        let arr = new MDArray(3,3)
        arr.fill(4)
        test(mulMD(arr,2).toJSFlatArray(),[8,8,8, 8,8,8, 8,8,8])
    }
    {
        //1d plus a slice of 2d
        let mat = new MDArray(3,3)
        mat.fillWith((x,y) => x*y)
        // console.log('mat is',mat, mat.toJSFlatArray())
        let slice = mat.slice([1,null])
        // console.log("slice is",slice, slice.toJSFlatArray())
        let vec = new MDArray(3)
        vec.fill(3)
        // console.log("vec is",vec)
        test(addMD(slice,vec).toJSFlatArray(),[3,4,5])
    }
    {
        //init a 2d array
        let data = [1,1,
                    0,0,
                    1,1,]
        let mat = MDArray_fromList(data,[2,3])
        let arr2 = new MDArray(2,3)
        arr2.fill(1)
        arr2.set2(0,1,0)
        arr2.set2(1,1,0)
        test(mat.toJSFlatArray(), arr2.toJSFlatArray())
        test(mat.toJSFlatArray(),[1,1,0,0,1,1])
    }
    {
        //add and assign to the y component of a list of points as a 2d array
        let data = [1,2,
                    3,4,
                    5,6]
        let arr = MDArray_fromList(data,[2,3])
        // console.log('arr is',arr.toJSFlatArray())
        //move down by four pixels
        let slice = arr.slice([1,null])
        // console.log("sliceo is",slice,slice.toJSFlatArray())
        // console.log('element 0 of slice is',slice.get1(0))
        incrementMD(slice,4)
        // test(arr.toJSFlatArray(),[1,6, 3,8, 5,10])
    }
    /*
    {
        //an array of rects
        let rects = range(3).map((i)=>new KRect({x:i,w:10}))
        let arr = MDArray.fromList(rects,3,1)
        test(arr.slice('x').asJSFlatArray(),[0,1,2])
        test(arr.slice('y').asJSFlatArray(),[0,0,0])
        test(arr.slice('w').asJSFlatArray(),[10,10,10])
        increment(arr.slice('y'),5)
        test(arr.slice('y').asJSFlatArray(),[5,5,5])
    }
    {
        //make a 5x5 image of black
        let img1 = MDArray(5,5,3).fill(0)
        //make the first row red
        img1.slice(null,0,0).fill(1)
        //make the second row 50% gray
        img1.slice(null,1,null).fill(0.5)
        //make the third row dark green
        img1.slice(null,1,1).fill(0.3)
        //brighten the entire image by multiplying by 2 and clamping
        let img2 = clamp(multiply(img1,2),0,1)
        //first row should still be full red
        test(img2.slice(null,0,null).asJSFlatArray(),[1,0,0, 1,0,0, 1,0,0, 1,0,0, 1,0,0])
        //second row should now be pure white
        test(img2.slice(null,1,null).asJSFlatArray(),[1,1,1, 1,1,1, 1,1,1, 1,1,1, 1,1,1])
        //third row should be brighter green
        test(img2.slice(null,2,null).asJSFlatArray(),[0,0.6,0, 0,0.6,0, 0,0.6,0, 0,0.6,0, 0,0.6,0, ])
    }
*/
}

Promise.all([
    // list_tests(),
    // math_tests(),
    mdarray_tests()
])
    .then(()=>console.log("all tests pass"))
