import './App.css'
import {
    AmplitudeEnvelope, DuoSynth,
    Filter,
    FrequencyEnvelope, Loop,
    MembraneSynth, MetalSynth,
    MonoSynth, Noise,
    NoiseSynth, now,
    Synth,
    Transport
} from "tone"
import {useEffect, useState} from 'react'
import {EnvelopeEditor, FilterEditor, NoiseEditor, SynthEditor} from './editors.jsx'
import {cls2str, HBox, range, SequencerGrid} from './comps.jsx'
import {generateUniqueID} from 'web-vitals/dist/modules/lib/generateUniqueID.js'

import "./grid2.css"
function MakeSynths() {


// filtering the hi-hats a bit
// to make them sound nicer
    const lowPass = new Filter({frequency: 14000,}).toDestination();

// we can make our own hi hats with
// the noise synth and a sharp filter envelope
    const openHiHat = new NoiseSynth({
        volume: -10,
        envelope: {
            attack: 0.01,
            decay: 0.7
        },
    }).connect(lowPass);


    const closedHiHat = new NoiseSynth({
        volume: -10,
        envelope: {
            attack: 0.01,
            decay: 0.05
        },
    }).connect(lowPass);

    let clap_synth = new NoiseSynth()
    clap_synth.connect(lowPass)
    clap_synth.set({
        volume:-10,
        "noise": {
            "type": "brown",
            "playbackRate": 0.4
        },
        "envelope": {
            "attackCurve": "exponential",
            "attack": 0.003,
            "decay": 0.5,
            "sustain": 0,
            "release": 0.4
        }
    })

    const kickSynth = new MembraneSynth({
        volume:-10
    }).toDestination()

    function makeDef(synth, simple, dur, note) {
        let syn = {
            name: simple.toLowerCase().replaceAll(" ", "_"),
            title: simple,
            synth: synth,
            dur: dur,
            count: 0,
            note: note||"C4",
        }
        return syn
    }

    // const simple_def = makeDef(new Synth().toDestination(),
    //     'simple', '8n', "C4")
    const kick_def = makeDef(kickSynth, "kick", "16n", "C1")
    const open_hat_def = makeDef(openHiHat, "Open Hat", "4n", "C2")
    const closed_hat_def = makeDef(closedHiHat, "Closed Hat", "4n", "C2")
    const clap_def = makeDef(clap_synth, "Clap", "4n", "C2")
    let synths = [
        open_hat_def,
        closed_hat_def,
        clap_def,
        kick_def,
    ]

    return synths
}

function BPMControl() {
    const [value, set_value] = useState(Transport.bpm.value)
    return <div className={"hbox control"}>
        <label>BPM</label>
        <input type={"range"} min={30} max={240} value={""+Math.floor(value)} step={1} onChange={(e)=>{
            let v = Math.floor(parseFloat(e.target.value))
            set_value(v)
            Transport.bpm.value = v
        }}/>
        <label style={{minWidth:"30px"}}>{Math.floor(Transport.bpm.value)}</label>
    </div>
}

function PlayPauseButton() {
    let [state, setState] = useState(Transport.state)
    let text = "???"
    if(state === "started") text = "on"
    if(state === "stopped") text = "off"
    return <button style={{
        fontSize:'200%',
        minWidth:'3em',
    }} onClick={()=>{
        if(Transport.state === "started") {
            Transport.stop()
        } else {
            Transport.start()//0,0)
        }
        console.log("new state is",Transport.state)
        setState(Transport.state)
    }}>{text}</button>
}

// Transport.on("start",(t) => {
//     console.log("starting",t)
// })
// Transport.on("stop",(t) => {
//     console.log("stopping",t)
// })
// Transport.on("pause",(t) => {
//     console.log("pausing",t)
// })
// Transport.on("loop",(t) => {
//     console.log("looping",t)
//})


let STATES = {
    "clear8":{
        name:"Empty 8",
        steps:8,
        stepSize:"40px",
        rowSize:"40px",
        data:null,
    },
    "clear16":{
        name:"Empty 16",
        steps:16,
        stepSize:"40px",
        rowSize:"40px",
        data:null
    },
    "4floor":{
        name:"Four on the Floor",
        steps:16,
        stepSize:"40px",
        rowSize:"40px",
        data:["0000 0000 0000 0000",
            "0000 0000 0000 0000",
            "0000 0000 0000 0000",
            "1000 1000 1000 1000",
        ]
    },
    "4floorbb":{
        name:"Four on the Floor w/ Backbeat",
        steps:16,
        stepSize:"40px",
        rowSize:"40px",
        data:[
            "0000 0000 0000 0000",
            "0000 0000 0000 0000",
            "0000 1000 0000 1000",
            "1000 1000 1000 1000",
        ]
    },
    "rock":{
        name:"Rock Basic",
        steps:16,
        stepSize:"40px",
        rowSize:"40px",
        data:[
            "0000 0000 0000 0000",
            "1010 1010 1010 1010",
            "0000 1000 0000 1000",
            "1000 0000 1000 0000",
        ]
    },
    "house":{
        name:"Classic House",
        steps:16,
        stepSize:"40px",
        rowSize:"40px",
        data:[
            "0000 0000 0000 0000",
            "0010 0010 0010 0010",
            "0000 1000 0000 1000",
            "1000 1000 1000 1000",
        ]
    },
    "wewillrockyou":{
        name:"We Will Rock You",
        steps:16,
        stepSize:"40px",
        rowSize:"40px",
        data:[
            null,
            null,
            "0000 1000 0000 1000",
            "1010 0000 1010 0000",
        ]
    },
}
function PresetsLoader({onChange}) {
    const [value, set_value] = useState("clear8")
    return <select value={value} onChange={(e)=>{
        onChange(STATES[e.target.value])
        set_value(e.target.value)
    }}>{Object.keys(STATES).map(name => <option key={name} value={name}>{STATES[name].name}</option>)}
    </select>
}

// let editable_synth = new Synth({
//     //amplitude envelope
//     envelope:{
//         attack:0,
//         decay:0.775,
//         sustain:0,
//         release:0.651
//     }
// });
// let low_pass = new Filter({
//     type:'lowpass',
//     frequency:100,
//     Q:0.2,
// })
// // low_pass.connect(editable_synth.output)
// editable_synth.connect(low_pass)
// let freq_env = new FrequencyEnvelope({
//     attack: 0,
//     decay:0.075,
//     sustain:0,
//     release:0.075,
//     baseFrequency: 107,
//     octaves: -0.5
// })
// freq_env.connect(editable_synth.oscillator.frequency)
// low_pass.toDestination()
//

// let noise = new Noise()
// let am = new AmplitudeEnvelope()
// noise.connect(am)
// am.toDestination()
// noise.start()
// let triggers = [noise,am]

// let noise = new NoiseSynth()
// noise.toDestination()

function TriggerButton({beatLength, synth}) {
    useEffect(()=>{
        // let notes = ["C4", "D4", "E4","F4"]
        // let count = 0
        // let loop = new Loop(time => {
        //     let note = notes[count % notes.length]
        //     triggers.forEach(trg => {
        //         console.log(trg.name)
        //         if(trg.name === "Synth") trg.triggerAttackRelease(note, "8n", time)
        //         if(trg.name === "FrequencyEnvelope") trg.triggerAttackRelease(time)
        //         if(trg.name === "NoiseSynth") trg.triggerAttackRelease("8n",time)
        //         if(trg.name === "AmplitudeEnvelope") trg.triggerAttackRelease("8n",time)
        //     })
        //     count = count + 1
        // }, beatLength).start(0)
        // return () => {
        //     console.log("stopping")
        // }
    })
    return <button onClick={() => {
        let note = "C4"
        let dur = beatLength
        let time = now()
        let trg = synth
        if(trg.name === "Synth") trg.triggerAttackRelease(note, dur, time)
        if(trg.name === "FrequencyEnvelope") trg.triggerAttackRelease(time)
        if(trg.name === "NoiseSynth") trg.triggerAttackRelease(dur,time)
        if(trg.name === "AmplitudeEnvelope") trg.triggerAttackRelease(dur,time)
    }}>pulse</button>
}
let MASTER_SYNTHS = MakeSynths()
// editable_synth.toDestination()

class Wrapper {
    constructor(obj) {
        this.obj = obj
        this.id = generateUniqueID()
    }
    get_value(name) {
        let prop = this.obj[name]
        // console.log("get_value",name,prop, this.obj)
        if(prop === undefined) return null
        if(prop && prop.name) return prop.value
        return prop
    }
    set_value(name,value) {
        let prop = this.obj[name]
        if(prop && prop.name) return prop.value = value
        this.obj[name] = value
    }
}
class SynthWrapper {
    constructor(synth,name) {
        this.synth = synth
        this.name = name
        this.id = generateUniqueID()
    }
    title() {
        return this.name
    }
    get_value(name) {
        let prop = this.synth[name]
        if(prop === undefined) return null
        if(prop && prop.name) return prop.value
        return prop
    }
    set_value(name,value) {
        let prop = this.synth[name]
        if(prop && prop.name) return prop.value = value
        this.synth[name] = value
    }
    triggerAttackRelease(note,dur,time) {
        if(this.synth.name === "NoiseSynth") return this.synth.triggerAttackRelease(dur,time)
        return this.synth.triggerAttackRelease(note,dur,time)
    }
    noises() {
        if(this.synth.noise) return [new Wrapper(this.synth.noise)]
        return []
    }
    oscillators(){
        let oscs = []
        if(this.synth.voice0) oscs.push(new Wrapper(this.synth.voice0.oscillator))
        if(this.synth.voice1) oscs.push(new Wrapper(this.synth.voice1.oscillator))
        if(this.synth.oscillator) oscs.push(new Wrapper(this.synth.oscillator))
        return oscs
    }
    envelopes() {
        if(this.synth.envelope) return [new Wrapper(this.synth.envelope)]
        return []
    }
    extra_props() {
        if(this.synth.name === "MembraneSynth") return ['octaves','pitchDecay','volume']
        if(this.synth.name === "DuoSynth") return ['vibratoAmount','vibratoRate','harmonicity']
        return []
    }
    filters() {
        let filters = []
        if(this.synth.filter) filters.push(new Wrapper(this.synth.filter))
        if(this.synth.voice0) filters.push(new Wrapper(this.synth.voice0.filter))
        if(this.synth.voice1) filters.push(new Wrapper(this.synth.voice1.filter))
        return filters
    }
}

let bass_line = {
    //the active synth
    //number of notes
    //the actual notes available
    //the beats on or off
}

class EventSource {
    constructor() {
        this.listeners = {}
    }
    on(type, cb) {
        if(!this.listeners[type]) this.listeners[type] = []
        this.listeners[type].push(cb)
    }
    off(type, cb) {
        if(!this.listeners[type]) this.listeners[type] = []
        this.listeners[type] = this.listeners[type].filter(c => c !== cb)
    }
    fire(type,payload) {
        if(!this.listeners[type]) this.listeners[type] = []
        this.listeners[type].forEach(cb => cb(payload))
    }
}
class BassLineSequence extends EventSource {
    constructor(synth,notes,stepCount) {
        super()
        this.synth = synth
        this.notes = notes
        this.stepCount = stepCount
        this.steps = this.notes.map((n,j) => {
            return range(stepCount).map(i => {
                return {
                    on:false,
                    col:i,
                    row:j,
                }
            })
        })
        console.log("final steps are",this.steps)
        // this.synth.start()
    }
    toggle(row,col) {
        this.steps[row][col].on = !this.steps[row][col].on
        this.fire("change",{})
    }
    isOn(row,col) {
        return this.steps[row][col].on
    }
    playNote(row,col) {
        let note = this.notes[row]
        if(this.isOn(row,col)) {
            let time = now()
            this.synth.triggerAttackRelease(note,'8n',time)
        }
    }
    playColumn(col) {
        this.notes.forEach((note,row)=>this.playNote(row,col))
    }
}

let bass_steps = new BassLineSequence(new MonoSynth().toDestination(),
    ["C4",'D4',"E4"].reverse(),
    8)


function StepCell({row, col, data, active_step}) {
    const [on,set_on] = useState(data.isOn(row,col))
    useEffect(()=>{
        console.log("rebuilt")
        let cb = () => {
            set_on(data.isOn(row,col))
        }
        data.on('change',cb)
        return () => {
            data.off('change',cb)
        }
    })

    let clss = {
        'step-cell':true,
        'on':on,
        'active':col === active_step
    }

    return <div className={cls2str(clss)} onClick={()=>{
        data.toggle(row,col)
        data.playNote(row,col)
    }
    }/>
}

function SequencerGrid2({data, onEdit}) {
    const [playing, set_playing] = useState(false)
    const [loop, set_loop] = useState(null)
    const [step, set_step] = useState(0)
    let stepSize = '40px'
    let rowSize = '40px'
    let style = {
        display:"grid",
        gridTemplateColumns:`5rem repeat(${data.stepCount},${stepSize})`,
        gridTemplateRows: `repeat(${data.notes.length}, ${rowSize})`,
    }
    function edit_synth() {
        onEdit(data)
    }
    function toggle_sequencer() {
        if(playing) {
            set_playing(false)
            loop.stop()
        } else {
            set_playing(true)
            let count = 0
            set_loop(new Loop((time)=>{
                let step = count%data.stepCount
                set_step(step)
                data.playColumn(step)
                count++
            },'8n').start())
        }
    }
    let rows = data.notes.map((note,j) => {
        return <>
            <div className={'header'} key={'header'+note}>{note}</div>
            {range(data.stepCount).map((col)=> {
                return <StepCell key={"step"+col} row={j} col={col} data={data} active_step={step}/>
            })}
        </>
    })
    return <div style={style} className={'sequencer-grid2'}>{rows}
        <button onClick={toggle_sequencer}>{playing?"pause":"play"}</button>
        <button onClick={edit_synth}>edit</button>
    </div>
}

function App() {
    const [global_state, set_global_state] = useState(STATES['clear8'])
    const [editing_synth, set_editing_synth] = useState(null)
    if(!global_state.data) global_state.data = []
  return (
    <div className="App">
        <HBox>
            <PlayPauseButton/>
            <BPMControl/>
        </HBox>
        <PresetsLoader onChange={(preset)=>set_global_state(preset)}/>
        <h3>{global_state.name}</h3>
        <SequencerGrid
            stepCount={global_state.steps}
            synths={MASTER_SYNTHS}
            stepSize={global_state.stepSize}
            rowSize={global_state.rowSize}
            initial_data={global_state.data}
            onEdit={synth => {
                set_editing_synth(new SynthWrapper(synth.synth,synth.name))
            }}
        />
        <SequencerGrid2 data={bass_steps} onEdit={data => set_editing_synth(new SynthWrapper(data.synth, data.name))}/>
        <HBox>
            {/*<button onClick={()=>set_editing_synth(new SynthWrapper(new Synth().toDestination()))}>+ simple synth</button>*/}
            <button onClick={()=>set_editing_synth(new SynthWrapper(new MonoSynth().toDestination()))}>+ mono synth</button>
            <button onClick={()=>set_editing_synth(new SynthWrapper(new DuoSynth().toDestination()))}>+ duo synth</button>
        {/*    <button onClick={()=>{*/}
        {/*        set_synths(synths.concat([new MonoSynth().toDestination()]))*/}
        {/*    }}>add mono synth</button>*/}
        {/*    <button onClick={()=>{*/}
        {/*        set_synths(synths.concat([new DuoSynth().toDestination()]))*/}
        {/*    }}>add duo synth</button>*/}
        {/*    <button onClick={()=>{*/}
        {/*        set_synths(synths.concat([new NoiseSynth().toDestination()]))*/}
        {/*    }}>add noise synth</button>*/}
        {/*    <button onClick={()=>{*/}
        {/*        set_synths(synths.concat([new MembraneSynth().toDestination()]))*/}
        {/*    }}>add membrane synth</button>*/}
        {/*    <button onClick={()=>{*/}
        {/*        set_synths(synths.concat([new MetalSynth().toDestination()]))*/}
        {/*    }}>add metal synth</button>*/}
        </HBox>
        {/*<TriggerButton triggers={triggers} beatLength={"2n"}/>*/}
        {/*<TriggerButton triggers={triggers} beatLength={"4n"}/>*/}
        {editing_synth?<SynthEditor key={editing_synth.id} synth={editing_synth}/>:<div/>}
    </div>
  );
}

export default App;
