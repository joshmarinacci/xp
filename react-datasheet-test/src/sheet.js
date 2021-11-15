import React, {useEffect, useRef, useState} from 'react'
import "./sheet.css"


function classes_to_string(obj) {
    let clss = ""
    Object.keys(obj).forEach(key => {
        if (obj[key] === true) {
            clss += " " + key
        }
    })
    return clss
}

function CellEditor({item, value, name, onEdited}) {
    let [temp, set_temp] = useState(value)
    let ref = useRef()
    useEffect(() => ref.current.focus())  //auto focus
    return <td className={'cell editing'}>
        <input ref={ref} type="text" value={temp}
               onKeyDown={e => {
                   if (e.key === 'Enter') {
                       e.preventDefault()
                       e.stopPropagation()
                       onEdited(item, name, temp)
                   }
               }}
               onChange={(e) => {
                   set_temp(e.target.value)
               }
               }/>
    </td>
}

function SheetRow({item, columns, onSetActive, activePoint, rowNum, editing, onEdited}) {
    return <tr>
        {columns.map((col, colNum) => {
            let val = item[col.name]
            let active = (colNum === activePoint.col && rowNum === activePoint.row)
            if (editing && active) {
                return <CellEditor key={colNum} item={item} value={val} name={col.name}
                                   onEdited={onEdited}/>
            }
            let style = {
                cell: true,
                active: active,
                changed: item._changed === true
            }
            return <td className={classes_to_string(style)} key={colNum}
                       onClick={(e) => {
                           onSetActive({row: rowNum, col: colNum})
                       }
                       }
            >{val}</td>
        })}
    </tr>
}

export function Sheet({data = [], columns = []}) {
    let [active, setActive] = useState({row: -1, col: -1})
    let [editing, setEditing] = useState(false)
    let ref = useRef()
    const handlers = {
        'ArrowLeft': () => {
            if (active.col >= 1) {
                setActive({
                    col: active.col - 1,
                    row: active.row
                })
            }
        },
        'ArrowRight': () => {
            if (active.col < columns.length - 1) {
                setActive({
                    col: active.col + 1,
                    row: active.row
                })
            }
        },
        'ArrowUp': (e) => {
            if (active.row >= 1) {
                setActive({
                    col: active.col,
                    row: active.row - 1
                })
            }
        },
        'ArrowDown': () => {
            if (active.row < data.length - 1) {
                setActive({
                    col: active.col,
                    row: active.row + 1
                })
            }
        },
        'Enter': () => {
            setEditing(true)
        }
    }

    const onEdited = (item, key, value) => {
        data[active.row][key] = value
        data[active.row]._changed = true
        setEditing(false)
        ref.current.focus()
    }


    return <table
        ref={ref}
        tabIndex={0}
        onKeyDown={(e) => handlers[e.key] ? handlers[e.key](e) : ""}>
        <tbody>
        <tr>
            {columns.map((col, i) => <th key={i}>{col.info.title}</th>)}
        </tr>
        {data.map((item, rowNum) => <SheetRow key={rowNum}
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
