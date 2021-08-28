import './App.css';
import {SequencerGrid} from './comps.jsx'
import {
    AmplitudeEnvelope,
    Filter,
    FrequencyEnvelope,
    MembraneSynth,
    NoiseSynth,
    Oscillator, Part, Sequence, Synth, Transport
} from "tone"



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
    simple_def,
    open_hat_def,
    closed_hat_def,
    clap_def,
    kick_def,
]

open_hat_def.synth.volume.value = -20
kick_def.synth.volume.value = -20



// const simplesynth = new Synth().toDestination();
// let count = 0
// let seq = new Sequence((time,note)=>{
//     console.log(time)
//     // console.log("triggering",note,time,count)//seq.length,seq.progress,seq.loopStart,seq.loopEnd,seq.loop, seq.subdivision, seq.value,seq.humanize)
//     // count = (count + 1) % seq.length
//     simplesynth.triggerAttackRelease(note,0.1,time)
//     // console.log(seq.events)
// },["C4","E4","G4"]).start(0)

function App() {
  return (
    <div className="App">
        <SequencerGrid steps={8} synths={synths}/>
        <button onClick={()=>{
            Transport.toggle()
        }}>toggle</button>
        <button onClick={()=>{
            // seq.events = ["C4",null,"G4"]
            // seq.events[1] = null
        }}>change</button>
    </div>
  );
}

export default App;
