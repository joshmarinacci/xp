import './App.css';
import {SequencerGrid, Spacer} from './comps.jsx'
import {
    AmplitudeEnvelope,
    Filter,
    FrequencyEnvelope,
    MembraneSynth,
    NoiseSynth,
    Oscillator, Part, Sequence, Synth, Transport
} from "tone"
import {useState} from 'react'

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

function HBox({children}) {
    return <div className={'hbox'}>{children}</div>
}

function PlayPauseButton() {
    let [state, setState] = useState(Transport.state)
    let text = "???"
    if(state === "started") text = "pause"
    if(state === "stopped") text = "play"
    return <button onClick={()=>{
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


function App() {
    const [global_state, set_global_state] = useState(STATES['clear8'])
    if(!global_state.data) global_state.data = []
  return (
    <div className="App">
        <PresetsLoader onChange={(preset)=>set_global_state(preset)}/>
        <h3>{global_state.name}</h3>
        <SequencerGrid
            steps={global_state.steps}
            synths={MakeSynths()}
            stepSize={global_state.stepSize}
            rowSize={global_state.rowSize}
            initial_data={global_state.data}
        />
        <HBox>
            <BPMControl/>
            <PlayPauseButton/>
        </HBox>
    </div>
  );
}

export default App;
