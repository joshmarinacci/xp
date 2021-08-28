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



// filtering the hi-hats a bit
// to make them sound nicer
const lowPass = new Filter({ frequency: 14000, }).toDestination();

// we can make our own hi hats with
// the noise synth and a sharp filter envelope
const openHiHat = new NoiseSynth({
    volume: -10,
    envelope: {
        attack: 0.01,
        decay: 0.7
    },
}).connect(lowPass);
// const open_hat_def = {
//     title:'Open Hat',
//     name:'open_hat',
//     dur:'4n',
//     synth: openHiHat,
//     play:()=> {
//          openHiHat.triggerAttack(open_hat_def.dur)
//     }
// }



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
    "noise": {
        "type": "white",
        "playbackRate" : 0.4
    },
    "envelope": {
        "attackCurve" : "exponential",
        "attack": 0.003,
        "decay": 0.5,
        "sustain": 0,
        "release": 0.4
    }
})

const kickSynth = new MembraneSynth().toDestination()

function makeDef(synth, simple, dur,note) {
    let syn = {
        name:simple.toLowerCase().replaceAll(" ","_"),
        title:simple,
        synth:synth,
        dur:dur,
        count:0,
        note:note,
    }
    return syn
}

const simple_def = makeDef(new Synth().toDestination(),
    'simple','8n',"C4")
const kick_def = makeDef(kickSynth,"kick","8n","C2")
const open_hat_def = makeDef(openHiHat,"Open Hat","4n","C2")
const closed_hat_def = makeDef(closedHiHat,"Closed Hat","4n","C2")
const clap_def = makeDef(clap_synth,"Clap","4n","C2")
let synths = [
    // simple_def,
    open_hat_def,
    closed_hat_def,
    clap_def,
    kick_def,
]

open_hat_def.synth.volume.value = -20
kick_def.synth.volume.value = -20


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
        Transport.toggle()
        console.log("new state is",Transport.state)
        setState(Transport.state)
    }}>{text}</button>
}

function App() {

  return (
    <div className="App">
        <SequencerGrid steps={8} synths={synths}/>
        <HBox>
            <BPMControl/>
            <PlayPauseButton/>
        </HBox>
    </div>
  );
}

export default App;
