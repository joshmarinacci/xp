import {HBox, VBox} from './comps.jsx'
import {useEffect, useState} from 'react'
import {Loop, now, Pattern, Transport} from 'tone'


let OSC_TYPES = [
    "amsine","amsquare","amtriangle","amsawtooth",
    "fmsine","fmsquare","fmtriangle","fmsawtooth",
]
let CURVES = ["linear","exponential"]
let FILTER_TYPES = ["lowpass","highpass","bandpass","lowshelf","highshelf","notch","allpass","peaking"]

function PropGrid({obj, props}) {
    return <div className={"prop-grid"}>
        <label>other</label> <b></b>
        {props.map(prop => {
            return <>
                <label key={`name_${prop}`}>{prop}</label>
                <b></b>
                <i key={`value_${prop}`}>{obj.get_value(prop)}</i>
            </>
        })}
    </div>
}

function PropEditorRow({obj,prop}) {
    if(prop === 'vibratoAmount') return <PropSlider name={prop} prop={prop} obj={obj} min={0} max={1}/>
    if(prop === 'vibratoRate') return <PropSlider name={prop} prop={prop} obj={obj} min={0} max={1000}/>
    if(prop === 'harmonicity') return <PropSlider name={prop} prop={prop} obj={obj} min={0} max={2}/>
    return <>
            <label key={`name_${prop}`}>{prop}</label>
            <b></b>
            <i key={`value_${prop}`}>{obj.get_value(prop)}</i>
    </>
}

function PropEditorGrid({obj, props}) {
    return <div className={"prop-grid"}>
        <label>other props</label> <b></b>
        {props.map(prop => <PropEditorRow key={`row_${prop}`} obj={obj} prop={prop}/>)}
    </div>
}

export function OscillatorEditor({oscillator}) {
    let [type, set_type] = useState(oscillator.get_value('type'))//oscillator?oscillator.type:"")
    return <div className={"prop-grid"}>
        <label>name</label> <b>{oscillator.get_value('name')}</b>
        <label>type</label><select value={type} onChange={(e)=>{
            oscillator.set_value('type',e.target.value)
            set_type(e.target.value)
        }}>{OSC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {/*<div className={"prop-grid"}>*/}
            {/*<b>harmonicity</b><i>{oscillator.get_value('harmonicity')}</i>*/}
        {/*</div>*/}
        {/*<PropGrid obj={oscillator} props={["modulationType","partialCount","phase","type"]}/>*/}
        <PropSlider name={"detune"} min={-100} max={100} obj={oscillator} prop={"detune"}/>
    </div>
}

function PropSlider({prop, obj, min, max, name}) {
    const [value, set_value] = useState(()=> obj.get_value(prop))
    return <>
        <label>{name?name:prop}</label>
        <input className={"tslider"}
            type={"range"} min={min*100} max={max*100} value={value*100}
               onChange={(e)=>{
                   let v = (parseFloat(e.target.value))/100
                   obj.set_value(name,v)
                   set_value(v)
               }}
        />
        <b>{value.toFixed(2)}</b>
    </>
}
function PropSelect({obj, prop, values}) {
    const [value, set_value] = useState(obj.get_value(prop))
    return <>
        <label>{prop}</label>
        <select value={value} onChange={(e)=>{
            let v = e.target.value
            set_value(v)
            obj.set_value(prop,v)
        }}>
            {values.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
    </>
}
export function EnvelopeEditor({envelope}) {
    if(!envelope) return <div></div>
    let extras = []
    if(envelope.baseFrequency) {
        extras.push(<PropSlider min={0} max={1000} obj={envelope} prop={"baseFrequency"}/>)
    }
    if(envelope.octaves) {
        extras.push(<PropSlider min={-4} max={4} obj={envelope} prop={"octaves"}/>)
    }
    return <div className={"prop-grid"}>
        <label>name</label> <b>{envelope.get_value('name')}</b>
        <PropSlider name={"attack"} min={0} max={2} obj={envelope} prop={"attack"}/>
        {/*<TSelect obj={envelope} prop={"attackCurve"} values={CURVES}/>*/}
        <PropSlider name={"decay"} min={0} max={2} obj={envelope} prop={"decay"}/>
        <PropSlider name={"sustain"} min={0} max={1} obj={envelope} prop={"sustain"}/>
        <PropSlider name={"release"} min={0} max={5} obj={envelope} prop={"release"}/>
        {extras}
    </div>
}
export function FilterEditor({filter}) {
    return <div className={"prop-grid"}>
        <label>Filter</label> <b>{filter.get_value('name')}</b>
        <PropSelect obj={filter} prop={"type"} values={FILTER_TYPES}/>
        <PropSlider name={"frequency"} min={0} max={20000} obj={filter} prop={"frequency"}/>
        <PropSlider name={"Q"} min={0} max={100} obj={filter} prop={"Q"}/>
        <PropSlider name={"detune"} min={0} max={100} obj={filter} prop={"detune"}/>
        <PropSlider name={"gain"} min={0} max={100} obj={filter} prop={"gain"}/>
    </div>
}

function CycleButton({synth}) {
    const [loop, set_loop] = useState(null)
    const [octave, set_octave] = useState(2)
    const [playing, set_playing] = useState(false)
    let notes = ["C","D","E","F"].map(l => l+octave)
    useEffect(()=>{
        if(loop) {
            loop.stop()
            set_loop(null)
        }

        if(playing) {
            let lp = new Pattern((time,note)=>{
                synth.triggerAttackRelease(note,"8n",time)
            },notes,"up").start()
            set_loop(lp)
        }
    },[octave,playing])
    return <HBox>
        <button onClick={()=>{
            set_playing(!playing)
        }}>{playing?"cycling":"cycle"}</button>
        <button onClick={()=>set_octave(Math.max(1,octave-1))}>-</button>
        <label>{octave}</label>
        <button onClick={()=>set_octave(Math.min(6,octave+1))}>+</button>
    </HBox>
}

export function SynthEditor({synth}) {
    const pulse = () => {
        let note = "C1"
        let dur = "16n"
        let time = now()
        synth.triggerAttackRelease(note,dur,time)
    }
    return <div className={"hbox control"}>
        <VBox>
            <h4>{synth.title()}</h4>
            <h4>{synth.get_value('name')}</h4>
            <button onClick={pulse}>pulse</button>
            <CycleButton synth={synth}/>
        </VBox>
        {synth.noises().map(noise => <NoiseEditor key={noise.id} noise={noise}/>)}
        {synth.oscillators().map(osc => <OscillatorEditor key={osc.id} oscillator={osc}/>)}
        {synth.envelopes().map(env =>   <EnvelopeEditor key={env.id} envelope={env}/>)}
        {synth.filters().map(filter =>  <FilterEditor key={filter.id} filter={filter}/>)}
        {/*<PropGrid obj={synth} props={synth.extra_props()}/>*/}
        <PropEditorGrid obj={synth} props={synth.extra_props()}/>
        <PropSlider name="volume" obj={synth} prop={'volume'} min={-20} max={20}/>
    </div>
}

export function NoiseEditor({noise}) {
    if(!noise) return <div/>
    return <div className={"vbox panel"}>
        <h4>Noise {noise.name}</h4>
        <PropSelect obj={noise} prop={"type"} values={["white","brown","pink"]}/>
    </div>
}
