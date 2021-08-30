import {range} from './comps.jsx'
import {now} from 'tone'
import {generateUniqueID} from 'web-vitals/dist/modules/lib/generateUniqueID.js'

class Wrapper {
    constructor(obj) {
        this.obj = obj
        this.id = generateUniqueID()
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

export class BassLineSequence extends EventSource {
    constructor(synth, notes, stepCount) {
        super()
        this.synth = synth
        this.notes = notes
        this.stepCount = stepCount
        this.steps = this.notes.map((n, j) => {
            return range(stepCount).map(i => {
                return {
                    on: false,
                    col: i,
                    row: j
                }
            })
        })
        console.log("final steps are", this.steps)
        // this.synth.start()
    }

    toggle(row, col) {
        this.steps[row][col].on = !this.steps[row][col].on
        this.fire("change", {})
    }

    isOn(row, col) {
        return this.steps[row][col].on
    }

    playNote(row, col) {
        let note = this.notes[row]
        if (this.isOn(row, col)) {
            let time = now()
            this.synth.triggerAttackRelease(note, '8n', time)
        }
    }

    playColumn(col) {
        this.notes.forEach((note, row) => this.playNote(row, col))
    }
}
