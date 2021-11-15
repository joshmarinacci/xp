// import ReactDataSheet from 'react-datasheet';
// import 'react-datasheet/lib/react-datasheet.css';
import './App.css';
import React, {useEffect, useRef, useState} from 'react'

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

function classes_to_string(obj) {
    let clss = ""
    Object.keys(obj).forEach(key => {
        if(obj[key] === true) {
            clss += " " + key
        }
    })
    return clss
}

function CellEditor({item,value,name, onEdited}) {
    let [temp, set_temp] = useState(value)
    let ref = useRef()
    useEffect(()=> ref.current.focus())  //auto focus
    return <td className={'cell editing'}>
        <input ref={ref} type="text" value={temp}
        onKeyDown={e => {
        if(e.key === 'Enter') {
            e.preventDefault()
            e.stopPropagation()
            onEdited(item,name,temp)
        }}}
       onChange={(e)=>{
            set_temp(e.target.value)
        }
        }/>
    </td>
}

function SheetRow({item,columns, onSetActive, activePoint,rowNum, editing, onEdited}) {
    return <tr>
        {columns.map((col,colNum)=>{
            let val = item[col.name]
            let active = (colNum===activePoint.col && rowNum === activePoint.row)
            if(editing && active) {
                return <CellEditor key={colNum} item={item} value={val} name={col.name} onEdited={onEdited}/>
            }
            let style = {
                cell:true,
                active:active,
                changed:item._changed === true,
            }
            return <td className={classes_to_string(style)} key={colNum}
                       onClick={(e)=>{
                           onSetActive({row:rowNum,col:colNum})
                       }
                   }
            >{val}</td>
        })}
    </tr>
}


function Sheet({data=[],columns=[]}) {
    let [active, setActive] = useState({row:-1, col:-1})
    let [editing, setEditing] = useState(false)
    let ref = useRef()
    const handlers = {
        'ArrowLeft':() => {
            if(active.col >= 1) {
                setActive({
                    col:active.col-1,
                    row:active.row,
                })
            }
        },
        'ArrowRight':() => {
            if(active.col < columns.length-1) {
                setActive({
                    col:active.col+1,
                    row:active.row,
                })
            }
        },
        'ArrowUp':() => {
            if(active.row >= 1) {
                setActive({
                    col:active.col,
                    row:active.row-1,
                })
            }
        },
        'ArrowDown':() => {
            if(active.row < data.length-1) {
                setActive({
                    col:active.col,
                    row:active.row+1,
                })
            }
        },
        'Enter':()=>{
            setEditing(true)
        }
    }

    const onEdited = (item,key,value) => {
        data[active.row][key] = value
        data[active.row]._changed = true
        setEditing(false)
        ref.current.focus()
    }


    return <table
        ref={ref}
        tabIndex={0}
        onKeyDown={(e)=> handlers[e.key]? handlers[e.key](e):""}>
        <tbody>
        <tr>
            {columns.map((col,i) => <th key={i}>{col.info.title}</th>)}
        </tr>
        {data.map((item,rowNum)=><SheetRow key={rowNum}
                             item={item}
                             columns={columns}
                             rowNum={rowNum}
                             activePoint={active}
                             onSetActive={setActive}
                             editing={editing}
                             onEdited={onEdited}
            />
        )}
        </tbody>
    </table>
}
function App () {
    const [grid, set_grid] = useState([[]])
    const [props, set_props] = useState([])

    let save_changes = () => {
        grid.forEach(row => {
            if(row._changed) log("must save",row)
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
