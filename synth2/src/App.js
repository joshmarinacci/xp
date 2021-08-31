import './App.css'
import {useState} from 'react'
import {SynthEditor} from './editors.jsx'
import {BPMControl, HBox, PlayPauseButton, SequencerGrid} from './comps.jsx'

import {MultiInstrumentSequencerGrid, SingleInstrumentSequencerGrid} from './sequencer.jsx'
import {SingleInstrumentSequence, MultiInstrumentSequence, SynthWrapper} from './dataobjects.js'
import {MakeInstruments, MakePercussionInstruments} from './presets.js'

let DRUM_SYNTHS = MakePercussionInstruments()

let drum_track = new MultiInstrumentSequence("drum track",
    DRUM_SYNTHS,
    '16n',
    8
)

let INSTRUMENTS = MakeInstruments();
let bass_steps = new SingleInstrumentSequence(
    "Bass Line",
    'simple-sine',
    INSTRUMENTS['simple-sine'],
    ["C2",'D2',"E2","F2","G2"].reverse(),
    '16n',
    16)

let lead_steps = new SingleInstrumentSequence(
    "Lead",
    "simple-square",
    INSTRUMENTS['simple-square'],
    ["C4",'D4',"E4","F4","G4"].reverse(),
    '16n',
    16)


let loops = []
function start_global_loop() {
    if(loops.length > 0) {
        loops.forEach(lo => lo.stop())
        loops = []
    } else {
        loops = [drum_track.startLoop(),bass_steps.startLoop(), lead_steps.startLoop()]
    }
}


function App() {
    // const [global_state, set_global_state] = useState(STATES['clear8'])
    const [editing_synth, set_editing_synth] = useState(null)
    // if(!global_state.data) global_state.data = []
  return (
    <div className="App">
        <HBox>
            <PlayPauseButton/>
            <BPMControl/>
            <button onClick={()=>{
                start_global_loop()
            }}>global loop</button>
        </HBox>
        <MultiInstrumentSequencerGrid data={drum_track}
                                      onEdit={(synth,name) => set_editing_synth(new SynthWrapper(synth, name))}/>
        <SingleInstrumentSequencerGrid data={bass_steps}
                                       onEdit={(synth,name) => set_editing_synth(new SynthWrapper(synth, name))}
                                       availableInstruments={INSTRUMENTS}
        />
        <SingleInstrumentSequencerGrid data={lead_steps}
                                       onEdit={(synth,name) => set_editing_synth(new SynthWrapper(synth, name))}
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
