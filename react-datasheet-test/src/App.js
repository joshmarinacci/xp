import ReactDataSheet from 'react-datasheet';
import 'react-datasheet/lib/react-datasheet.css';
import './App.css';
import React from 'react'

/*
- [x] create columns for pet simulator
- [x] generate two rows of data as array of objects
- [x] load spreadsheet from the objects. need fixed order of keys
- [ ] mark edited cell green
- [ ] mark cell red when data changed
- [ ] mark row yellow when data changed
- [ ] button to print list of changed rows
- [ ] add new row
- [ ] dropdown for rarity based on enum of values
- [ ] dropdown for egg as autocomplete but type in whatever you want

 */
const data = [
    ['dog','basic','cracked egg',1000],
    ['cat','rare','puice egg',2000]
]
const columns = [
    {  name:'name', type:'string'  },
    { name:'rarity', type:'enum', values:['basic','rare','epic','legendary','mythic']},
    { name:'egg', type:'string'},
    { name:'cost', type:'integer'}
]



function App () {
    let grid = []
    let headers = columns.map(col => {
        return ({type:'header', value:col.name})
    })
    grid.push(headers)
    data.forEach(row => {
        grid.push(row.map(item => {
            return { type:'string', value:item }
        }))
    })
    console.log("grid is",grid)

    //used while viewing cells
    const render_value = (cell, i, j) => {
        // console.log("value",i,j,cell)
        if(cell.type === 'header') return <span className={'header'}>{cell.value}</span>
        return cell.value
    }
    //used while editing cells
    const render_data = (cell,i,j) => {
        console.log("data",i,j,cell)
        return cell.value
    }
    //called when things are changed
    const onCellsChanged = (changes) => {
        changes.forEach(({cell, row, col, value}) => console.log("New expression :" + value))
    }


    return <ReactDataSheet
        data={grid}
        valueRenderer={render_value}
        dataRenderer={render_data}
        onCellsChanged={onCellsChanged}
        />
}

export default App;
