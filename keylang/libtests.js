import {range, add, divide, KList, makeBinOp, multiply, subtract, zip} from './libs_js/common.js'
import {checkEqual} from './util.js'


async function run_tests() {
    function test(res,ans) {
        console.log("comparing",res,ans)
        if(!checkEqual(res,ans)) throw new Error("not equal")
    }

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
run_tests().then(()=>console.log("all tests pass"))
