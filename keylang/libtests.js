import {add, KList} from './lib.js'
import {checkEqual} from './util.js'

async function run_tests() {
    function test(res,ans) {
        if(!checkEqual(res,ans)) throw new Error("not equal")
    }
    test(add(new KList(0, 1, 2), new KList(5, 6, 7)), new KList(5, 7, 9))
}
run_tests().then(()=>console.log("all tests pass"))
