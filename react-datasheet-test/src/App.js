// import ReactDataSheet from 'react-datasheet';
// import 'react-datasheet/lib/react-datasheet.css';
import './App.css';
import React, {useState} from 'react'

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

const log = (...args) => console.log(...args)

function make_props_from_data(data) {
    return Object.keys(data.schema.properties)
}

function make_grid_from_data(data) {
    // console.log("json data is",data)
    let PROPS = make_props_from_data(data)
    let grid = []
    let headers = Object.keys(data.schema.properties).map(key => {
        return {
            type:'header',
            value:data.schema.properties[key].title,
            changed:false
        }
    })
    grid.push(headers)
    data.items.forEach(item => {
        grid.push(PROPS.map(prop => {
            return {
                type:'string',
                changed:false,
                value:item[prop]
            }
        }))
    })
    return grid
}

function SheetRow({item,columns}) {
    log("item",item)
    log(columns)
    return <tr>
        {columns.map((col,i)=>{
            let val = item[col.name]
            return <td className={'cell'} key={i}>{val}</td>
        })}
    </tr>
}

function Sheet({data=[],columns=[]}) {
    console.log("columns",columns)
    console.log('rendering data',data)
    return <table>
        <tbody>
        <tr>
            {columns.map((col,i) => {
                return <th key={i}>{col.info.title}</th>
            })}
        </tr>
        {data.map((item,i)=>{
            return <SheetRow key={i} item={item} columns={columns}/>
        })}
        </tbody>
    </table>
}
function App () {
    const [grid, set_grid] = useState([[]])
    const [props, set_props] = useState([])
    //used while viewing cells
    // const render_view = (cell, i, j) => {
        // console.log("view")
        // if(cell.type === 'header') {
        //     return <span className={'header'}>{cell.value}</span>
        // }
        // if(cell.changed) return <span className={'changed'}>{cell.value}</span>
        // console.log("returning",cell.value)
        // return cell.value
    // }
    //used while editing cells
    // const render_edit = (cell,i,j) => {
    //     // console.log("data",i,j,cell)
    //     return cell.value
    // }
    // const render_att = (cell,i,j)=>{
    //     return {'data-changed':cell.changed, 'data-header':cell.type === 'header'}
    // }
    //called when things are changed
    // const onCellsChanged = (changes) => {
    //     changes.forEach(({cell, row, col, value}) => {
    //         // console.log("updated: " + value, cell, row, col)
    //         if(cell.type === 'string') {
    //             cell.value = value
    //             cell.changed = true
    //         }
    //     })
    // }

    let save_changes = () => {
        // console.log('saving from',grid)
        grid.forEach(row => {
            row.forEach(cell => {
                if(cell.changed) console.log(cell)
            })
        })
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
        fetch("http://localhost:30088/dataset/petsimulatorx/load",
            {
            method:'POST',
            headers:{ 'Content-Type':'application/json'}
        })
            .then(res => res.json())
            .then((obj)=>{
                console.log("got the new data",obj.data)
                let props = Object.entries(obj.data.schema.properties).map(([key,value])=>{
                    return {
                        name:key,
                        info:value,
                    }
                })
                set_props(props)
                set_grid(obj.data.items)
            })
    }

    return <div>
        <div className={'hbox'}>
            <button onClick={load_data}>load</button>
            <button onClick={save_changes}>save</button>
        </div>
        <Sheet data={grid} columns={props}/>
        <div className={'hbox'}>
            <button onClick={add_row}>add item</button>
        </div>
    </div>
}

export default App;
