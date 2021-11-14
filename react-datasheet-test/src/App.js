import ReactDataSheet from 'react-datasheet';
import 'react-datasheet/lib/react-datasheet.css';
import './App.css';
import React, {useState} from 'react'

/*
- [x] create columns for pet simulator
- [x] generate two rows of data as array of objects
- [x] load spreadsheet from the objects. need fixed order of keys
- [x] mark selected cell green
- [x] mark cell red when data changed
- [ ] mark row yellow when data changed
- [x] button to print list of changed rows
- [ ] add new row
- [ ] dropdown for rarity based on enum of values
- [ ] dropdown for egg as autocomplete but type in whatever you want

 */
const JSON_DATA = {
    schema: {
        properties: {
            name: {title: 'name', type: 'string'},
            rarity: {
                title: 'rarity',
                type: 'enum',
                values: ['basic', 'rare', 'epic', 'legendary', 'mythic']
            },
            egg: {title: 'Egg', type: 'string'},
            cost: {title: 'Cost', type: 'integer'}
        }
    },
    items: [
        {name: 'dog', rarity: 'basic', egg: 'cracked egg', cost: 1000},
        // ['cat','rare','puice egg',2000]
    ]
}

function make_props_from_data(data) {
    return Object.keys(data.schema.properties)
}

const PROPS = make_props_from_data(JSON_DATA)

function make_grid_from_data(data) {
    // console.log("json data is",data)
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


function make_new_row() {
    return PROPS.map(prop => {
        return {
            type:'string',
            changed:false,
            value:''
        }
    })
}

function App () {
    const [grid, set_grid] = useState(()=>make_grid_from_data(JSON_DATA))
    //used while viewing cells
    const render_view = (cell, i, j) => {
        // console.log("view",i,j,cell)
        if(cell.type === 'header') {
            return <span className={'header'}>{cell.value}</span>
        }
        if(cell.changed) return <span className={'changed'}>{cell.value}</span>
        // console.log("returning",cell.value)
        return cell.value
    }
    //used while editing cells
    const render_edit = (cell,i,j) => {
        // console.log("data",i,j,cell)
        return cell.value
    }
    // const render_att = (cell,i,j)=>{
    //     return {'data-changed':cell.changed, 'data-header':cell.type === 'header'}
    // }
    //called when things are changed
    const onCellsChanged = (changes) => {
        changes.forEach(({cell, row, col, value}) => {
            // console.log("updated: " + value, cell, row, col)
            if(cell.type === 'string') {
                cell.value = value
                cell.changed = true
            }
        })
    }

    let save_changes = () => {
        // console.log('saving from',grid)
        grid.forEach(row => {
            row.forEach(cell => {
                if(cell.changed) console.log(cell)
            })
        })
    }
    let add_row = () => {
        let row = make_new_row()
        grid.push(row)
        set_grid(grid.slice())
    }
    return <div>
        <div className={'hbox'}>
            <button onClick={save_changes}>save</button>
        </div>
        <ReactDataSheet
            data={grid}
            valueRenderer={render_view}
            dataRenderer={render_edit}
            // attributesRenderer={render_att}
            onCellsChanged={onCellsChanged}
        />
        <div className={'hbox'}>
            <button onClick={add_row}>add item</button>
        </div>
    </div>
}

export default App;
