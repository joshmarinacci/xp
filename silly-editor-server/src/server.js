/*
tiny express server.

node src/server.js dataset.json

POST /dataset/name/load
POST /dataset/name/changed

 */

import express from "express"
import path from 'path'
import fs from 'fs'
import cors from 'cors'

const CACHE = []

const log = (...args) => console.log(...args)
const genid = (str) => str + "_" + Math.floor(Math.random()*10000000)


async function save_to(cacheElement, filename) {
    console.log("writing out to", filename)
    await fs.promises.writeFile(filename, JSON.stringify(cacheElement,null, '    '))
}

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
    console.log('data is',data)
    data.items.forEach(item => {
        console.log("item",item)
        if(!item.hasOwnProperty('_id')) item._id = genid("item")
    })
    CACHE[setname] = data
    log(CACHE)

    let app = express()
    app.use(cors())
    app.use(express.json())
    app.post('/dataset/:name/load',(req,res)=>{
        console.log("requesting the dataset",req.params.name)
        return res.json(CACHE[req.params.name])
    })
    app.post('/dataset/:name/changed',async (req,res)=>{
        console.log("got a change",req.params,req.body)
        let dataset = CACHE[req.params.name]
        dataset.items.forEach(item => {
            // console.log('checking item',item)
            if(item._id === req.body._id) {
                // console.log("we can update this one")
                Object.keys(req.body)
                    .filter(key => key !== '_id')
                    .filter(key => key !== '_changed')
                    .forEach(key => {
                        item[key] = req.body[key]
                    })
                console.log("final item is",item)
            }
        })
        await save_to(CACHE[req.params.name],filename)
        log("wrote it okay")
        res.json({success:true})
    })

    app.listen(30088,()=>{
        console.log('server is running ong port 30088')
    })

}
setup().then("done with setup")



