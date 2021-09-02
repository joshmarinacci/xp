import {range} from './comps.jsx'
import {Loop, now, Volume} from 'tone'
import {generateUniqueID} from 'web-vitals/dist/modules/lib/generateUniqueID.js'

class Wrapper {
    constructor(obj) {
        this.obj = obj
        this.id = generateUniqueID()
    }

    has_prop(name) {
        console.log("checking",name,'on',this.obj)
        return (this.obj[name] !== undefined)
    }
    get_value(name) {
        let prop = this.obj[name]
        // console.log("get_value",name,prop, this.obj)
        if (prop === undefined) return null
        if (prop && prop.name) return prop.value
        return prop
    }

    set_value(name, value) {
        let prop = this.obj[name]
        if (prop && prop.name) return prop.value = value
        this.obj[name] = value
    }
}

export class SynthWrapper {
    constructor(synth, name) {
        this.synth = synth
        this.name = name
        this.id = generateUniqueID()
    }

    title() {
        return this.name
    }

    get_value(name) {
        let prop = this.synth[name]
        if (prop === undefined) return null
        if (prop && prop.name) return prop.value
        return prop
    }

    set_value(name, value) {
        let prop = this.synth[name]
        if (prop && prop.name) return prop.value = value
        this.synth[name] = value
    }

    triggerAttackRelease(note, dur, time) {
        if (this.synth.name === "NoiseSynth") return this.synth.triggerAttackRelease(dur, time)
        return this.synth.triggerAttackRelease(note, dur, time)
    }

    noises() {
        if (this.synth.noise) return [new Wrapper(this.synth.noise)]
        return []
    }

    oscillators() {
        let oscs = []
        if (this.synth.voice0) oscs.push(new Wrapper(this.synth.voice0.oscillator))
        if (this.synth.voice1) oscs.push(new Wrapper(this.synth.voice1.oscillator))
        if (this.synth.oscillator) oscs.push(new Wrapper(this.synth.oscillator))
        return oscs
    }

    envelopes() {
        if (this.synth.envelope) return [new Wrapper(this.synth.envelope)]
        return []
    }

    extra_props() {
        if (this.synth.name === "MembraneSynth") return ['octaves', 'pitchDecay', 'volume']
        if (this.synth.name === "DuoSynth") return ['vibratoAmount', 'vibratoRate', 'harmonicity']
        return []
    }

    filters() {
        let filters = []
        if (this.synth.filter) filters.push(new Wrapper(this.synth.filter))
        if (this.synth.voice0) filters.push(new Wrapper(this.synth.voice0.filter))
        if (this.synth.voice1) filters.push(new Wrapper(this.synth.voice1.filter))
        return filters
    }
    filterEnvelopes() {
        let fenvs = []
        console.log('checking synth',this.synth)
        if (this.synth.filterEnvelope) fenvs.push(new Wrapper(this.synth.filterEnvelope))
        console.log(fenvs)
        return fenvs
    }
}

class EventSource {
    constructor() {
        this.listeners = {}
    }

    on(type, cb) {
        if (!this.listeners[type]) this.listeners[type] = []
        this.listeners[type].push(cb)
    }

    off(type, cb) {
        if (!this.listeners[type]) this.listeners[type] = []
        this.listeners[type] = this.listeners[type].filter(c => c !== cb)
    }

    fire(type, payload) {
        if (!this.listeners[type]) this.listeners[type] = []
        this.listeners[type].forEach(cb => cb(payload))
    }
}

class GenericSequence extends EventSource {
    constructor(name, stepCount) {
        super()
        this.name = name
        this.stepCount = stepCount
        this.currentStep = 0
    }
    getStepCount() {
        return this.stepCount
    }
    isOn(row, col) {
        return this.steps[row][col].on
    }
    toggle(row, col) {
        this.steps[row][col].on = !this.steps[row][col].on
        this.fire("change", {})
    }
    setOn(row,col,on) {
        this.steps[row][col].on = on
        this.fire("change", {})
    }
    getCell(row, col) {
        return this.steps[row][col]
    }
    startLoop() {
        let count = 0
        return new Loop((time)=>{
            let step = count % this.stepCount
            this.setCurrentStep(step)
            this.playColumn(step)
            count++
        },'4n').start(0)
    }

    setCurrentStep(step) {
        this.currentStep = step
        this.fire("step",this.currentStep)
    }
    getCurrentStep() {
        return this.currentStep
    }
}
export class SingleInstrumentSequence extends GenericSequence {
    constructor(name, instrumentName, instrument, notes, default_duration, stepCount) {
        super(name,stepCount)
        this.instrumentName = instrumentName
        this.synth = instrument
        this.volume = new Volume(0)
        this.synth.connect(this.volume)
        this.volume.toDestination()
        this.notes = notes
        this.default_duration = default_duration
        this.steps = this.notes.map((n, j) => {
            return range(stepCount).map(i => {
                return {
                    on: false,
                    col: i,
                    row: j,
                    dur:this.default_duration
                }
            })
        })
        // console.log("final steps are", this.steps)
        // this.synth.start()
    }
    getRowName(row) {
        return this.notes[row]
    }
    getRowCount() {
        return this.notes.length
    }


    playNote(row, col) {
        let note = this.notes[row]
        let cell = this.getCell(row,col)
        if (this.isOn(row, col)) {
            let time = now()
            this.synth.triggerAttackRelease(note, cell.dur, time)
        }
    }

    playColumn(col) {
        this.notes.forEach((note, row) => this.playNote(row, col))
    }

    getInstrumentName() {
        return this.instrumentName
    }
    setInstrument(key,value) {
        this.instrumentName = key
        this.synth.disconnect(this.volume)
        this.synth = value
        this.synth.connect(this.volume)
        this.fire("change",{})
    }
    getSynth() {
        return this.synth
    }
    isMute() {
        return this.volume.mute
    }
    toggleMute() {
        this.volume.mute = !this.volume.mute
        this.fire("mute",this.volume.mute)
    }
}

export class MultiInstrumentSequence extends GenericSequence {
    constructor(name, DRUM_SYNTHS, default_duration, stepCount) {
        super(name,stepCount)
        this.synths = DRUM_SYNTHS
        this.default_duration = default_duration
        this.steps = this.generateEmptySteps()
    }
    getInstrumentName() {
        return "multi"
    }
    getRowName(row) {
        return this.synths[row].name
    }
    getRowCount() {
        return this.synths.length
    }
    getRowSynth(row) {
        return this.synths[row]
    }
    toggleRowMute(row) {
        this.getRowSynth(row).synth.volume.mute = !this.getRowSynth(row).synth.volume.mute
        this.fire("mute",this.getRowSynth(row).synth.volume.mute)
    }
    isRowMute(row) {
        return this.getRowSynth(row).synth.volume.mute
    }
    playNote(row, col) {
        let synth = this.synths[row]
        let cell = this.getCell(row,col)
        if (this.isOn(row, col)) {
            let time = now()
            synth.synth.triggerAttackRelease(cell.dur, time)
        }
    }
    playColumn(col) {
        this.synths.forEach((note, row) => this.playNote(row, col))
    }

    loadPreset(preset) {
        this.stepCount = preset.steps
        this.steps = this.generateEmptySteps()
        if(preset.data) {
            preset.data.forEach((rowData,row) => {
                let chs = rowData.replaceAll(" ","").split("")
                chs.forEach((ch,col)=>{
                    this.getCell(row,col).on = (ch === "1")
                })
            })
        }
        this.fire("data",this)
        this.fire("change", {})
    }

    generateEmptySteps() {
        return this.synths.map((syn, j) => {
            return range(this.stepCount).map(i => {
                return {
                    on: false,
                    col: i,
                    row: j,
                    dur:this.default_duration
                }
            })
        })
    }
}
