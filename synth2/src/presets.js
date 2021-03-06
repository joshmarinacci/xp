import {Filter, MembraneSynth, MonoSynth, NoiseSynth} from 'tone'

export let STATES = {
    "clear8": {
        name: "Empty 8",
        steps: 8,
        stepSize: "40px",
        rowSize: "40px",
        data: null
    },
    "clear16": {
        name: "Empty 16",
        steps: 16,
        stepSize: "40px",
        rowSize: "40px",
        data: null
    },
    "4floor": {
        name: "Four on the Floor",
        steps: 16,
        stepSize: "40px",
        rowSize: "40px",
        data: ["0000 0000 0000 0000",
            "0000 0000 0000 0000",
            "0000 0000 0000 0000",
            "1000 1000 1000 1000"
        ]
    },
    "4floorbb": {
        name: "Four on the Floor w/ Backbeat",
        steps: 16,
        stepSize: "40px",
        rowSize: "40px",
        data: [
            "0000 0000 0000 0000",
            "0000 0000 0000 0000",
            "0000 1000 0000 1000",
            "1000 1000 1000 1000"
        ]
    },
    "rock": {
        name: "Rock Basic",
        steps: 16,
        stepSize: "40px",
        rowSize: "40px",
        data: [
            "0000 0000 0000 0000",
            "1010 1010 1010 1010",
            "0000 1000 0000 1000",
            "1000 0000 1000 0000"
        ]
    },
    "house": {
        name: "Classic House",
        steps: 16,
        stepSize: "40px",
        rowSize: "40px",
        data: [
            "0000 0000 0000 0000",
            "0010 0010 0010 0010",
            "0000 1000 0000 1000",
            "1000 1000 1000 1000"
        ]
    },
    "wewillrockyou": {
        name: "We Will Rock You",
        steps: 16,
        stepSize: "40px",
        rowSize: "40px",
        data: [
            null,
            null,
            "0000 1000 0000 1000",
            "1010 0000 1010 0000"
        ]
    }
}

export function MakePercussionInstruments() {


// filtering the hi-hats a bit
// to make them sound nicer
    const lowPass = new Filter({frequency: 14000}).toDestination()

// we can make our own hi hats with
// the noise synth and a sharp filter envelope
    const openHiHat = new NoiseSynth({
        volume: -10,
        envelope: {
            attack: 0.01,
            decay: 0.7
        }
    }).connect(lowPass)


    const closedHiHat = new NoiseSynth({
        volume: -10,
        envelope: {
            attack: 0.01,
            decay: 0.05
        }
    }).connect(lowPass)

    let clap_synth = new NoiseSynth()
    clap_synth.connect(lowPass)
    clap_synth.set({
        volume: -10,
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
        volume: -10
    }).toDestination()

    function makeDef(synth, simple, dur, note) {
        let syn = {
            name: simple.toLowerCase().replaceAll(" ", "_"),
            title: simple,
            synth: synth,
            dur: dur,
            count: 0,
            note: note || "C4"
        }
        return syn
    }

    // const simple_def = makeDef(new Synth().toDestination(),
    //     'simple', '8n', "C4")
    const kick_def = makeDef(kickSynth, "kick", "16n", "C1")
    const open_hat_def = makeDef(openHiHat, "Open Hat", "16n", "C2")
    const closed_hat_def = makeDef(closedHiHat, "Closed Hat", "16n", "C2")
    const clap_def = makeDef(clap_synth, "Clap", "16n", "C2")
    let synths = [
        open_hat_def,
        closed_hat_def,
        clap_def,
        kick_def
    ]

    return synths
}

export function MakeInstruments() {
    return {
        'simple-sine': new MonoSynth({
            title:'simple-sine',
            oscillator:{
                type:"amsine",
            },
        }),
        'simple-square': new MonoSynth({
            oscillator:{
                type:"amsquare",
            },
        }),
        'simple-sawtooth': new MonoSynth({
            oscillator:{
                type:"amsawtooth",
            },
        }),
    }
}
