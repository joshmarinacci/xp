export class KList {
    constructor(...args) {
        this.data = []
        args.forEach(arg => {
            if(Array.isArray(arg)) {
                this.data.push(...arg)
            } else {
                this.data.push(arg)
            }
        })
        this.get = (index)=>this.data[index]
    }
    // get(index) {
    //     console.log(`KList.get(${index})`)
    //     return this.data[index]
    // }
}


export const STD_SCOPE = {
    List:(...args)=>{
        // console.log("got the args",...args)
        return new KList(...args)
    },
    getPart:(obj,name) => {
        // let proto = Object.getPrototypeOf(obj)
        // console.log("obj",obj,'name',name)
        // console.log("proto is",proto)
        // console.log("proto names",Object.getOwnPropertyNames(proto))
        // console.log("trying index",obj['get'])
        // console.log('get part returning',name,'from',obj,
        //     Object.getPrototypeOf(obj)[name])
        // console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(obj)))
        // console.log("methods",getMethods(obj))
        return obj[name]
    },
    range:(...args)=> {
        let arr = []
        for(let i=0; i<args[0]; i++) {
            arr[i]= i
        }
        let list = new KList(arr)
        // console.log('testing the list',list.get(1))
        return list
    },
    add:(a,b) => {
        return a + b
    }

}
