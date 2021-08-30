import './App.css'
import {MonoSynth} from "tone"
import {useState} from 'react'
import {SynthEditor} from './editors.jsx'
import {BPMControl, HBox, PlayPauseButton, SequencerGrid} from './comps.jsx'

import {SequencerGrid2} from './sequencer.jsx'
import {BassLineSequence, SynthWrapper} from './dataobjects.js'
import {MakeInstruments, MakePercussionInstruments, STATES} from './presets.js'


function PresetsLoader({onChange}) {
    const [value, set_value] = useState("clear8")
    return <select value={value} onChange={(e)=>{
        onChange(STATES[e.target.value])
        set_value(e.target.value)
    }}>{Object.keys(STATES).map(name => <option key={name} value={name}>{STATES[name].name}</option>)}
    </select>
}

let MASTER_SYNTHS = MakePercussionInstruments()

let INSTRUMENTS = MakeInstruments();
let bass_steps = new BassLineSequence(
    "Bass Line",
    'simple-sine',
    INSTRUMENTS['simple-sine'],
    ["C2",'D2',"E2","F2","G2"].reverse(),
    '16n',
    16)

let lead_steps = new BassLineSequence(
    "Lead",
    "simple-square",
    INSTRUMENTS['simple-square'],
    ["C2",'D2',"E2","F2","G2"].reverse(),
    '16n',
    16)


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
        <SequencerGrid2
            data={bass_steps}
            onEdit={data => set_editing_synth(new SynthWrapper(data.synth, data.name))}
            availableInstruments={INSTRUMENTS}
        />
        <SequencerGrid2
            data={lead_steps}
            onEdit={data => set_editing_synth(new SynthWrapper(data.synth, data.name))}
            availableInstruments={INSTRUMENTS}
        />
        <div>
            <h3>current synth</h3>
            {editing_synth?<SynthEditor key={editing_synth.id} synth={editing_synth}/>:<div/>}
        </div>
    </div>
  );
}

export default App;
