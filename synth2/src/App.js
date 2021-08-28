import './App.css';
import {SequencerGrid} from './comps.jsx'
import {NoiseSynth} from "tone"

const open_hat = {
    title:'Open Hat',
    name:'open_hat',
    synth: new NoiseSynth({
        "volume" : -5,
        "envelope" : {
            "attack" : 0.001,
            "decay" : 0.2,
            "sustain" : 0
        },
        "filterEnvelope" : {
            "attack" : 0.001,
            "decay" : 0.1,
            "sustain" : 0
        }
    }).toDestination()
}
const closed_hat = {
    title:'Closed Hat',
    name:'closed_hat',
    synth: new NoiseSynth({
        "volume" : -5,
        "envelope" : {
            "attack" : 0.001,
            "decay" : 0.2,
            "sustain" : 0
        },
        "filterEnvelope" : {
            "attack" : 0.001,
            "decay" : 0.1,
            "sustain" : 0
        }
    }).toDestination()
}
const clap = {
    name:'clap',
    title:'Clap',
    synth: new NoiseSynth({
        "volume" : -5,
        "envelope" : {
            "attack" : 0.001,
            "decay" : 0.2,
            "sustain" : 0
        },
        "filterEnvelope" : {
            "attack" : 0.001,
            "decay" : 0.1,
            "sustain" : 0
        }
    }).toDestination()
}
const kick = {
    name:'kick',
    title:'kick',
    synth: new NoiseSynth({
        "volume" : -5,
        "envelope" : {
            "attack" : 0.001,
            "decay" : 0.2,
            "sustain" : 0
        },
        "filterEnvelope" : {
            "attack" : 0.001,
            "decay" : 0.1,
            "sustain" : 0
        }
    }).toDestination()
}


let synths = [
    open_hat,
    closed_hat,
    clap,
    kick,
]

function App() {
  return (
    <div className="App">
        <SequencerGrid steps={8} synths={synths}/>
    </div>
  );
}

export default App;
