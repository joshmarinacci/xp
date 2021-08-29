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
            if(typeof v === 'object') v = v.value
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
    return <div className={"prop-grid"}>
        <label>name</label> <b>{oscillator.name}</b>
        <label>type</label>
        <select value={type} onChange={(e)=>{
            oscillator.set({type:e.target.value})
            set_type(e.target.value)
        }}>{OSC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
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
    return <>
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
        <b>{value}</b>
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
        extras.push(<TSlider min={0} max={1000} obj={envelope} prop={"baseFrequency"}/>)
    }
    if(envelope.octaves) {
        extras.push(<TSlider min={-4} max={4} obj={envelope} prop={"octaves"}/>)
    }
    return <div className={"prop-grid"}>
        <label>Envelope:</label> <b>{envelope.name}</b>
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
    return <div className={"prop-grid"}>
        <label>Filter</label> <b>{filter.name}</b>
        <TSelect obj={filter} prop={"type"} values={FILTER_TYPES}/>
        <TSlider name={"frequency"} min={0} max={20000} obj={filter} prop={"frequency"}/>
        <TSlider name={"Q"} min={0} max={100} obj={filter} prop={"Q"}/>
        <TSlider name={"detune"} min={0} max={100} obj={filter} prop={"detune"}/>
        <TSlider name={"gain"} min={0} max={100} obj={filter} prop={"gain"}/>
    </div>
}

export function SynthEditor({synth}) {
    let [looper, set_loop] = useState(null)
    useEffect(() => {
        console.log('initial setup')
        let notes = ["C4", "D4", "E4","F4"]
        let count = 0
        let loop = new Loop(time => {
            let note = notes[count % notes.length]
            // triggers.forEach(trg => {
            //     console.log(trg.name)
            //     if(trg.name === "Synth") trg.triggerAttackRelease(note, "8n", time)
            //     if(trg.name === "FrequencyEnvelope") trg.triggerAttackRelease(time)
            // if(synth.name === "NoiseSynth") synth.triggerAttackRelease("8n",time)
            // })
            synth.triggerAttackRelease(note, "8n", time)
            count = count + 1
        }, "2n")
        set_loop(loop)
    }, [synth])
    const pulse = () => {
        let note = "C4"
        let dur = "4n"
        let time = now()
        if(synth.name === "NoiseSynth") return synth.triggerAttackRelease(dur,time)
        return synth.triggerAttackRelease(note,dur,time)
    }
    const cycle = () => {
        console.log("looper is",looper)
        looper.start(now())
    }

    if(synth.name === "DuoSynth") {
        return <div className={'vbox duo-panel'}>
            <HBox>
                <button onClick={pulse}>pulse</button>
                <button onClick={cycle}>cycle</button>
            </HBox>
            <SynthEditor key={"voice0"} synth={synth.voice0}/>
            <SynthEditor key={"voice1"} synth={synth.voice1}/>
        </div>
    }
    return <div className={"vbox control"}>
        <h4>{synth.name}</h4>
        <HBox>
            <button onClick={pulse}>pulse</button>
            <button onClick={cycle}>cycle</button>
        </HBox>
        <NoiseEditor noise={synth.noise}/>
        <OscillatorEditor oscillator={synth.oscillator}/>
        <EnvelopeEditor envelope={synth.envelope}/>
        <FilterEditor filter={synth.filter}/>
        <EnvelopeEditor envelope={synth.filterEnvelope}/>
        <TSlider name="volume" obj={synth.volume} prop={'value'} min={-20} max={20}/>
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
