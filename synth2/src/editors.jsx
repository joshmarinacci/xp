import {HBox, VBox} from './comps.jsx'
import {useEffect, useState} from 'react'
import {Loop, now, Transport} from 'tone'


let OSC_TYPES = [
    "amsine","amsquare","amtriangle","amsawtooth",
    "fmsine","fmsquare","fmtriangle","fmsawtooth",
]

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

function TSelect({obj, prop, values}) {
    const [value, set_value] = useState(obj[prop])
    return <>
        <label>{prop}</label>
        <select value={value} onChange={(e)=>{
            let v = e.target.value
            set_value(v)
            obj[prop] = v
            console.log("object is now",obj)
        }}>
            {values.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
    </>
}

let CURVES = ["linear","exponential"]

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
let FILTER_TYPES = ["lowpass","highpass","bandpass","lowshelf","highshelf","notch","allpass","peaking"]
export function FilterEditor({filter}) {
    console.log("filter is",filter)
    if(!filter) return <div></div>
    return <div className={"prop-grid"}>
        <label>Filter</label> <b>{filter.name}</b>
        <TSelect obj={filter} prop={"type"} values={FILTER_TYPES}/>
        <PropSlider name={"frequency"} min={0} max={20000} obj={filter} prop={"frequency"}/>
        <PropSlider name={"Q"} min={0} max={100} obj={filter} prop={"Q"}/>
        <PropSlider name={"detune"} min={0} max={100} obj={filter} prop={"detune"}/>
        <PropSlider name={"gain"} min={0} max={100} obj={filter} prop={"gain"}/>
    </div>
}

export function SynthEditor({synth}) {
    console.log("synth is",synth)
    // let [looper, set_loop] = useState(null)
    // useEffect(() => {
    //     console.log('initial setup')
    //     let notes = ["C4", "D4", "E4","F4"]
    //     let count = 0
    //     let loop = new Loop(time => {
    //         let note = notes[count % notes.length]
    //         // triggers.forEach(trg => {
    //         //     console.log(trg.name)
    //         //     if(trg.name === "Synth") trg.triggerAttackRelease(note, "8n", time)
    //         //     if(trg.name === "FrequencyEnvelope") trg.triggerAttackRelease(time)
    //         // if(synth.name === "NoiseSynth") synth.triggerAttackRelease("8n",time)
    //         // })
    //         synth.triggerAttackRelease(note, "8n", time)
    //         count = count + 1
    //     }, "2n")
    //     set_loop(loop)
    // }, [synth])
    const pulse = () => {
        let note = "C1"
        let dur = "16n"
        let time = now()
        synth.triggerAttackRelease(note,dur,time)
    }
    const cycle = () => {
        // console.log("looper is",looper)
        // looper.start(now())
    }

    // if(synth.name === "DuoSynth") {
    //     return <div className={'vbox duo-panel'}>
    //         <HBox>
    //             <button onClick={pulse}>pulse</button>
    //             <button onClick={cycle}>cycle</button>
    //         </HBox>
    //         <SynthEditor key={"voice0"} synth={synth.voice0}/>
    //         <SynthEditor key={"voice1"} synth={synth.voice1}/>
    //     </div>
    // }
    let noise = <div/>
    if(synth.synth.noise) noise = <NoiseEditor noise={synth.synth.noise}/>
    // let osc = <div/>
    return <div className={"hbox control"}>
        <VBox>
            <h4>{synth.title()}</h4>
            <h4>{synth.get_value('name')}</h4>
            <button onClick={pulse}>pulse</button>
        </VBox>
        {noise}
        {synth.oscillators().map(osc => <OscillatorEditor key={osc.id} oscillator={osc}/>)}
        {synth.envelopes().map(env =>   <EnvelopeEditor key={env.id} envelope={env}/>)}
        {synth.filters().map(filter =>  <FilterEditor key={filter.id} filter={filter}/>)}
        {/*<EnvelopeEditor envelope={synth.filterEnvelope}/>*/}
        <PropGrid obj={synth} props={synth.extra_props()}/>
        <PropSlider name="volume" obj={synth} prop={'volume'} min={-20} max={20}/>
    </div>
}

export function DuoSynthEditor({synth}) {
    return <VBox>
        <SynthEditor synth={synth.voice0}/>
        <SynthEditor synth={synth.voice1}/>
    </VBox>
}

export function NoiseEditor({noise}) {
    if(!noise) return <div/>
    return <div className={"vbox panel"}>
        <h4>Noise {noise.name}</h4>
        <TSelect obj={noise} prop={"type"} values={["white","brown","pink"]}/>
    </div>
}
