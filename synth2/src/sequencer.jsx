import {useEffect, useState} from 'react'
import {cls2str, HBox, range} from './comps.jsx'
import "./sequencer.css"
import {STATES} from './presets.js'

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

    return <div className={cls2str(clss)}
        onMouseDown={() => {
            data.toggle(row, col)
            data.playNote(row, col)
        }}
        onMouseMove={(e)=>{
            if(e.buttons === 1 && !data.isOn(row,col)) {
                data.setOn(row,col,true)
            }
        }}
    >{data.getCell(row,col).dur}</div>
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
function TestHeader({data,row}) {
    return <div>{data.getRowName(row)}</div>
}
function SequenceGrid({data, header, onEdit}) {
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
    let Header = header
    if(!Header) Header = TestHeader
    let rows = range(data.getRowCount()).map((num, j) => {
        return <>
            {/*<div className={'header'} key={'header' + num}>{data.getRowName(j)}</div>*/}
            <Header className={'header'} key={'header'+num} data={data} row={num} onEdit={onEdit}/>
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

function VolumeSlider({volumeNode}) {
    const [val, set_val] = useState(volumeNode.volume.value)
    return <HBox>
        <label>volume</label>
        <input type={'range'} min={-20} max={20} value={val}
               onChange={(e)=>{
                   let val = parseFloat(e.target.value)
                   volumeNode.volume.value = val
                   set_val(val)
               }}
        />
        <label>{val.toFixed(1)}</label>
    </HBox>
}

export function SingleInstrumentSequencerGrid({data, onEdit, availableInstruments}) {
    return <div className={'sequencer'}>
        <HBox>
            <h4>{data.name}</h4>
            <MuteButton instrument={data}/>
            <VolumeSlider volumeNode={data.volume}/>
        </HBox>
        <SequenceGrid data={data} onEdit={onEdit}/>
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

function PresetsLoader({onChange}) {
    const [value, set_value] = useState("clear8")
    return <select value={value} onChange={(e)=>{
        onChange(STATES[e.target.value])
        set_value(e.target.value)
    }}>{Object.keys(STATES).map(name => <option key={name} value={name}>{STATES[name].name}</option>)}
    </select>
}

function SimpleHeader({data,row, onEdit}) {
    return <div>{row} {data.getRowName(row)} <button onClick={()=>{
        onEdit(data.getRowSynth(row).synth)
    }}>edit</button></div>
}
export function MultiInstrumentSequencerGrid({data,onEdit}) {
    return <div className={'sequencer'}>
        <HBox>
            <h4>{data.name}</h4>
            <PresetsLoader onChange={(preset)=>{
                data.loadPreset(preset)
            }}/>
        </HBox>
        <SequenceGrid data={data} header={SimpleHeader} onEdit={onEdit}/>
        <HBox>
            <label>{data.default_duration}</label>
        </HBox>
    </div>
}
