import {HBox, VBox} from './comps.jsx'
import {useEffect, useState} from 'react'
import {Loop, now, Transport} from 'tone'


let OSC_TYPES = [
    "amsine","amsquare","amtriangle","amsawtooth",
    "fmsine","fmsquare","fmtriangle","fmsawtooth",
]

function PropGrid({obj, props}) {
    return <div className={"prop-grid"}>
        {props.map(prop => {
            let v = obj[prop]
            let name = <b key={`name_${prop}`}>{prop}</b>
            console.log("value",v,typeof v)
            if(typeof v === 'object') {
                v = v.value
            }
            return <>
            {name}
                <i key={`value_${prop}`}>{v}</i>
            </>
        })}
    </div>
}

export function OscillatorEditor({oscillator}) {
    let [type, set_type] = useState(oscillator.type)
    return <VBox>
        <div><b>name</b> {oscillator.name}</div>
        <div><b>type</b>
            <label>{oscillator.type}</label>
            <select value={type} onChange={(e)=>{
                oscillator.set({type:e.target.value})
                set_type(e.target.value)
            }}>{OSC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
        </div>
        {/*<div className={"prop-grid"}>*/}
        {/*    <b>harmonicity</b><i>{oscillator.harmonicity.value}</i>*/}
        {/*</div>*/}
        {/*<PropGrid obj={oscillator} props={["modulationType","partialCount","phase","type"]}/>*/}
    </VBox>
}

function TSlider({prop, obj, min, max, name}) {
    const [value, set_value] = useState(obj[prop])
    return <HBox>
        <label>{name}</label>
        <input className={"tslider"}
        type={"range"} min={min*100} max={max*100} value={value*100}
               onChange={(e)=>{
                   let v = (parseFloat(e.target.value))/100
                   obj[prop] = v
                   set_value(v)
               }}
        />
        <label>{value}</label>
    </HBox>
}

function TSelect({obj, prop, values}) {
    const [value, set_value] = useState(obj[prop])
    return <HBox>
        <label>{prop}</label>
        <select value={value} onChange={(e)=>{
            let v = e.target.value
            set_value(v)
            obj[prop] = v
        }}>
            {values.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
    </HBox>
}

let CURVES = ["linear","exponential"]

function EnvelopeEditor({envelope}) {
    return <div className={"vbox panel"}>
        <label><b>Envelope:</b> {envelope.name}</label>
        <label>{envelope.attack}</label>
        <TSlider name={"attack"} min={0} max={2} obj={envelope} prop={"attack"}/>
        <TSelect obj={envelope} prop={"attackCurve"} values={CURVES}/>
        <TSlider name={"decay"} min={0} max={2} obj={envelope} prop={"decay"}/>
        <TSlider name={"release"} min={0} max={5} obj={envelope} prop={"release"}/>
        <TSlider name={"sustain"} min={0} max={1} obj={envelope} prop={"sustain"}/>
        <label>{envelope.decay}</label>
    </div>
}

function FilterEditor({filter}) {
    return <div className={"vbox panel"}>
        <h4>Filter</h4>
        <TSlider name={"frequency"} min={0} max={1500} obj={filter.frequency} prop={"value"}/>
        <PropGrid obj={filter} props={["frequency","Q","detune","type"]}/>
    </div>
}

export function SynthEditor({synth}) {
    useEffect(() => {
        console.log('initial setup')
        let nows = now()
        let notes = ["C4", "D4", "E4","F4"]
        let count = 0
        let loop = new Loop(time => {
            synth.triggerAttackRelease(notes[count % notes.length], "8n", time)
            count = count + 1
        }, "4n").start(0)
        // synth.triggerAttackRelease("C4","8n",nows)
        // synth.triggerAttackRelease("E4","8n",nows+0.5)
        // synth.triggerAttackRelease("G4","8n",nows+1)
    }, [synth])
    return <div className={'control'}>
        <h4>edit</h4>
        <VBox>
            <label>osc<OscillatorEditor oscillator={synth.oscillator}/></label>
            <label>env<EnvelopeEditor envelope={synth.envelope}/></label>
            <label><FilterEditor filter={synth.filter}/></label>
            <TSlider name="volume" obj={synth.volume} prop={'value'} min={-20} max={20}/>
        </VBox>
        <button onClick={() => Transport.toggle()}>start</button>
    </div>
}
