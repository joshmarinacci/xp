import {useEffect, useState} from 'react'
import {cls2str, HBox, range} from './comps.jsx'
import {Loop} from 'tone'
import "./sequencer.css"

function StepCell({row, col, data, active_step}) {
    const [on, set_on] = useState(data.isOn(row, col))
    useEffect(() => {
        let cb = () => {
            set_on(data.isOn(row, col))
        }
        data.on('change', cb)
        return () => {
            data.off('change', cb)
        }
    })

    let clss = {
        'step-cell': true,
        'on': on,
        'active': col === active_step,
        'four':col%4 === 0,
    }

    return <div className={cls2str(clss)} onClick={() => {
        data.toggle(row, col)
        data.playNote(row, col)
    }
    }>{data.getCell(row,col).dur}</div>
}

export function SequencerGrid2({data, onEdit}) {
    const [playing, set_playing] = useState(false)
    const [loop, set_loop] = useState(null)
    const [step, set_step] = useState(0)
    let stepSize = '40px'
    let rowSize = '40px'
    let style = {
        display: "grid",
        gridTemplateColumns: `5rem repeat(${data.stepCount},${stepSize})`,
        gridTemplateRows: `repeat(${data.notes.length}, ${rowSize})`
    }

    function edit_synth() {
        onEdit(data)
    }

    function toggle_sequencer() {
        if (playing) {
            set_playing(false)
            loop.stop()
        } else {
            set_playing(true)
            let count = 0
            set_loop(new Loop((time) => {
                let step = count % data.stepCount
                set_step(step)
                data.playColumn(step)
                count++
            }, '4n').start())
        }
    }

    let rows = data.notes.map((note, j) => {
        return <>
            <div className={'header'} key={'header' + note}>{note}</div>
            {range(data.stepCount).map((col) => {
                return <StepCell key={"step" + col} row={j} col={col} data={data}
                                 active_step={step}/>
            })}
        </>
    })
    return <div style={style} className={'sequencer-grid2'}>{rows}
        <HBox>
            <button onClick={toggle_sequencer}>{playing ? "pause" : "play"}</button>
            <button onClick={edit_synth}>edit</button>
            <label>{data.synth.name}</label><label>{data.default_duration}</label>
        </HBox>
    </div>
}
