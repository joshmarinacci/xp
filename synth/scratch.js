
//(LFO(20) * note) => sawtooth() => gainAdsr()
//notes and durations and beat frequency => instrument()


const C4 = 440
const D4 = 450
const E4 = 500

function instrument(note) {
    return gainADSR(sawtooth(LFO(20), note))
}

const NOTES = [[C4, N4], [D4, N4][E4, N4]]

play(NOTES, N2, instrument)



