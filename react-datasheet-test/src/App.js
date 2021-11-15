// import ReactDataSheet from 'react-datasheet';
// import 'react-datasheet/lib/react-datasheet.css';
import './App.css'
import React, {useState} from 'react'
import {Sheet} from './sheet.js'

/*
- [ ] create columns for pet simulator
- [ ] generate two rows of data as array of objects
- [ ] load spreadsheet from the objects. need fixed order of keys
- [ ] mark selected cell green
- [ ] mark cell red when data changed
- [ ] mark row yellow when data changed
- [ ] button to print list of changed rows
- [ ] add new row
- [ ] dropdown for rarity based on enum of values
- [ ] dropdown for egg as autocomplete but type in whatever you want

 */

// const dataset_name = "petsimulatorx"
// const dataset_name = "alphabet"
const dataset_name = "tallest_buildings"

const log = (...args) => console.log(...args)


function App () {
    const [grid, set_grid] = useState([[]])
    const [props, set_props] = useState([])

    let save_changes = async () => {
        console.log('checking in grid',grid)
        for(let row of grid) {
            if(row._changed) {
                log("we must save",row)
                let res = await fetch(`http://localhost:30088/dataset/${dataset_name}/changed`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(row)})
                log("got the result",res)
            }
        }
    }
    let add_row = () => {
        let item = {}
        props.forEach(col => {
            item[col.name] = "yozer"
        })
        grid.push(item)
        set_grid(grid.slice())
    }
    async function load_data() {
        let res = await fetch(`http://localhost:30088/dataset/${dataset_name}/load`,
            {
            method:'POST',
            headers:{ 'Content-Type':'application/json'}
        })
        let obj = await res.json()
        console.log("got the new data",obj)
        let props = Object.entries(obj.schema.properties).map(([key,value])=>{
            return {
                name:key,
                info:value,
            }
        })
        set_props(props)
        set_grid(obj.items)
    }

    return <div>
        <h3>Editing {dataset_name}</h3>
        <div className={'hbox'}>
            <button onClick={load_data}>load</button>
            <button onClick={()=>save_changes().then("done")}>save</button>
        </div>
        <div className={'scroll-pane'}>
            <Sheet data={grid} columns={props}/>
        </div>
        <div className={'hbox'}>
            <button onClick={add_row}>add item</button>
        </div>
    </div>
}

export default App;
