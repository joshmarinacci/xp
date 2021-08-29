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
    let [type, set_type] = useState(oscillator?oscillator.type:"")
    if(!oscillator) return <div></div>
    return <div className={"vbox panel"}>
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
        <TSlider name={"detune"} min={-100} max={100} obj={oscillator} prop={"detune"}/>
    </div>
}

function TSlider({prop, obj, min, max, name}) {
    const [value, set_value] = useState(()=>{
        if(obj[prop].name && obj[prop].name === "Signal") {
            // console.log("is a signal")
            return obj[prop].value
        } else {
            return obj[prop]
        }
    })
    return <HBox>
        <label>{name?name:prop}</label>
        <input className={"tslider"}
        type={"range"} min={min*100} max={max*100} value={value*100}
               onChange={(e)=>{
                   let v = (parseFloat(e.target.value))/100
                   if(obj[prop].name && obj[prop].name=== 'Signal') {
                       // console.log("setting", v, "on", obj, prop)
                       obj[prop].value = v
                   } else {
                       obj[prop] = v
                   }
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
            console.log("object is now",obj)
        }}>
            {values.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
    </HBox>
}

let CURVES = ["linear","exponential"]

export function EnvelopeEditor({envelope}) {
    if(!envelope) return <div></div>
    let extras = []
    if(envelope.baseFrequency) {
        extras.push(<TSlider min={0} max={1000} obj={envelope} prop={"baseFrequency"}/>)
    }
    if(envelope.octaves) {
        extras.push(<TSlider min={-4} max={4} obj={envelope} prop={"octaves"}/>)
    }
    return <div className={"vbox panel"}>
        <label><b>Envelope:</b> {envelope.name}</label>
        <TSlider name={"attack"} min={0} max={2} obj={envelope} prop={"attack"}/>
        {/*<TSelect obj={envelope} prop={"attackCurve"} values={CURVES}/>*/}
        <TSlider name={"decay"} min={0} max={2} obj={envelope} prop={"decay"}/>
        <TSlider name={"sustain"} min={0} max={1} obj={envelope} prop={"sustain"}/>
        <TSlider name={"release"} min={0} max={5} obj={envelope} prop={"release"}/>
        {extras}
    </div>
}
let FILTER_TYPES = ["lowpass","highpass","bandpass","lowshelf","highshelf","notch","allpass","peaking"]
export function FilterEditor({filter}) {
    if(!filter) return <div></div>
    return <div className={"vbox panel"}>
        <h4>Filter {filter.name}</h4>
        <TSelect obj={filter} prop={"type"} values={FILTER_TYPES}/>
        <TSlider name={"frequency"} min={0} max={20000} obj={filter} prop={"frequency"}/>
        <TSlider name={"Q"} min={0} max={100} obj={filter} prop={"Q"}/>
        <TSlider name={"detune"} min={0} max={100} obj={filter} prop={"detune"}/>
        <TSlider name={"gain"} min={0} max={100} obj={filter} prop={"gain"}/>
        {/*<PropGrid obj={filter} props={["frequency","Q","detune","type","gain"]}/>*/}
    </div>
}

export function SynthEditor({synth, triggers=[]}) {
    useEffect(() => {
        console.log('initial setup')
        // let nows = now()
        let notes = ["C4", "D4", "E4","F4"]
        let count = 0
        let loop = new Loop(time => {
            let note = notes[count % notes.length]
            triggers.forEach(trg => {
                console.log(trg.name)
                if(trg.name === "Synth") trg.triggerAttackRelease(note, "8n", time)
                if(trg.name === "FrequencyEnvelope") trg.triggerAttackRelease(time)
                if(trg.name === "NoiseSynth") trg.triggerAttackRelease("8n",time)
            })
            // synth.triggerAttackRelease(note, "8n", time)
            count = count + 1
        }, "4n").start(0)
        // synth.triggerAttackRelease("C4","8n",nows)
        // synth.triggerAttackRelease("E4","8n",nows+0.5)
        // synth.triggerAttackRelease("G4","8n",nows+1)
    }, [synth])
    return <div className={'control'}>
        <h4>edit</h4>
        <VBox>
            <label><OscillatorEditor oscillator={synth.oscillator}/></label>
            <label><EnvelopeEditor envelope={synth.envelope}/></label>
            <label><FilterEditor filter={synth.filter}/></label>
            <label><EnvelopeEditor envelope={synth.filterEnvelope}/></label>
            <TSlider name="volume" obj={synth.volume} prop={'value'} min={-20} max={20}/>
        </VBox>
        <button onClick={() => Transport.toggle()}>start</button>
    </div>
}

export function NoiseEditor({noise}) {
    if(!noise) return <div/>
    return <div className={"vbox panel"}>
        <h4>Noise {noise.name}</h4>
        <TSelect obj={noise} prop={"type"} values={["white","brown","pink"]}/>
    </div>
}
