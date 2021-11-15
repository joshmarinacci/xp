/*
tiny express server.

node src/server.js dataset.json

POST /dataset/name/load
POST /dataset/name/changed

 */

import Express from "express"
import path from 'path'
import fs from 'fs'
import cors from 'cors'

const CACHE = []

const log = (...args) => console.log(...args)
const genid = (str) => str + "_" + Math.floor(Math.random()*10000000)


async function setup() {
    if(process.argv.length < 3) {
        console.error("node src/server.js dataset.json")
        return
    }
    let filename = process.argv[2]
    let setname = path.basename(filename,'.json')

    log(`using the dataset name ${setname}`)

    let buff = await fs.promises.readFile(filename)
    let data = JSON.parse(buff.toString())
    data.data.items.forEach(item => {
        console.log("item",item)
        if(!item.hasOwnProperty('_id')) item._id = genid("item")
    })
    CACHE[setname] = data
    log(CACHE)

    let app = Express()
    app.use(cors())
    app.post('/dataset/:name/load',(req,res)=>{
        console.log("requesting the dataset",req.params.name)
        return res.json(CACHE[req.params.name])
    })

    app.listen(30088,()=>{
        console.log('server is running ong port 30088')
    })

}
setup().then("done with setup")



