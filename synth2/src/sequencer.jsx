import {useEffect, useState} from 'react'
import {cls2str, HBox, range} from './comps.jsx'
import "./sequencer.css"

function StepCell({row, col, data, active_step}) {
    const [on, set_on] = useState(data.isOn(row, col))
    useEffect(() => {
        let cb = () => set_on(data.isOn(row, col))
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
function InstrumentSelector({availableInstruments,data}) {
    const [name,sname] = useState(data.getInstrumentName())
    useEffect(() => {
        let cb = () => sname(data.getInstrumentName())
        data.on('change', cb)
        return () => {
            data.off('change', cb)
        }
    })
    return <select
        value={name}
        onChange={(e)=>{
            let name = e.target.value
            data.setInstrument(name, availableInstruments[name])
        }}
    >
        {Object.keys(availableInstruments).map(name => {
            return <option key={name} name={name}>{name}</option>
        })}
    </select>
}
function SequenceGrid({data}) {
    const [step, setStep] = useState(data.getCurrentStep())
    const [stepCount, setStepCount] = useState(data.getStepCount())
    let stepSize = '40px'
    let rowSize = '40px'
    let style = {
        display: "grid",
        gridTemplateColumns: `10rem repeat(${stepCount},${stepSize})`,
        gridTemplateRows: `repeat(${data.getRowCount()}, ${rowSize})`
    }
    useEffect(() => {
        console.log("rebuilding ")
        const hand = (step) => {
            setStep(step)
        }
        data.on("step",hand)
        return () => {
            data.off("step",hand)
        }
    })
    useEffect(() => {
        let cb = () => setStepCount(data.getStepCount())
        data.on('data', cb)
        return () => {
            data.off('data', cb)
        }
    })
    let rows = range(data.getRowCount()).map((num, j) => {
        return <>
            <div className={'header'} key={'header' + num}>{data.getRowName(j)}</div>
            {range(data.getStepCount()).map((col) => {
                return <StepCell key={"step" + col} row={j} col={col} data={data}
                                 active_step={step}/>
            })}
        </>
    })
    return <div style={style} className={'grid'}>
        {rows}
    </div>
}

function MuteButton({instrument}) {
    const [mute, set_mute] = useState(instrument.isMute())
    useEffect(()=>{
        let cb = () => {
            set_mute(instrument.isMute())
        }
        instrument.on("mute",cb)
        return () => {
            instrument.off("mute",cb)
        }
    })
    return <button onClick={()=>{
        instrument.toggleMute()
    }}>{instrument.isMute()?"unmute":"mute"}</button>
}

export function SingleInstrumentSequencerGrid({data, onEdit, availableInstruments}) {
    return <div className={'sequencer'}>
        <HBox>
            <h4>{data.name}</h4>
            <MuteButton instrument={data}/>
        </HBox>
        <SequenceGrid data={data}/>
        <HBox>
            <InstrumentSelector
                availableInstruments={availableInstruments}
                data={data}
            />
            <button onClick={()=>onEdit(data.getSynth())}>edit</button>
            <label>{data.default_duration}</label>
        </HBox>
    </div>
}
export function MultiInstrumentSequencerGrid({data,onEdit}) {
    return <div className={'sequencer'}>
        <h4>{data.name}</h4>
        <SequenceGrid data={data}/>
        <HBox>
            <label>{data.default_duration}</label>
        </HBox>
    </div>
}
