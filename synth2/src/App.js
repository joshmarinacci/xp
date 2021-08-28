import './App.css';
import {SequencerGrid} from './comps.jsx'
import {MembraneSynth, NoiseSynth} from "tone"

const open_hat = {
    title:'Open Hat',
    name:'open_hat',
    dur:'4n',
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
    dur:'4n',
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
    dur:'4n',
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
    dur:'8n',
    synth: new MembraneSynth({
        "envelope" : {
            "sustain" : 0,
            "attack" : 0.02,
            "decay" : 0.1
        },
        "octaves" : 10
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
