import "./synth.css"
import {useEffect, useState} from 'react'
import {Sequence, Transport} from 'tone'
function range(len){
    let nums = []
    for(let i=0; i<len; i++) {
        nums.push(i)
    }
    return nums
}

function play_example(synth) {
    console.log("playing",synth.synth.name)
    if(synth.synth.name === 'MembraneSynth') {
        synth.synth.triggerAttackRelease('C2',synth.dur)
        return
    }
    synth.synth.triggerAttackRelease(synth.dur)
}

function cls2str(obj) {
    return Object.entries(obj).filter(([key,value])=>value)
        .map(([key,value])=>key)
        .join(" ")

}

function Step({col, onToggle, step}) {
    const cls = {
        step:true,
        four:step.col%4===0,
        on:step.on,
    }
    return <div className={cls2str(cls)} onClick={()=>onToggle(step)}/>
}

function make_Seq(synth, stepCount) {
    console.log("made sequence for ",synth.name)
    let events = range(stepCount).map(i => null)
    let seq = new Sequence((time,note)=>{
        console.log("playing",time,note,synth.synth.name)
        if(synth.synth.name === 'NoiseSynth') {
            synth.synth.triggerAttackRelease("4n",time)
            return
        }
        synth.synth.triggerAttackRelease(note,0.1,time)
    },events).start(0)
    synth.seq = seq
}
function SynthRow({synth, stepCount}) {
    let [steps, setSteps] = useState(()=>{
        return range(stepCount).map(i => ({on:false, col:i}))
    })
    useEffect(()=>{
        make_Seq(synth,stepCount)
    },[synth])
    return <>
        <label key={'label'+synth.name} onClick={()=>play_example(synth)}>{synth.title}</label>
        {steps.map(step => <Step step={step} col={step.col}  key={synth.name+"_"+step.col} onToggle={(step)=>{
            // console.log('toggling',step, synth.seq.events[step.col])
            synth.seq.events[step.col] = null
            step.on = !step.on
            if(step.on) {
                synth.seq.events[step.col] = synth.note
            } else {
                synth.seq.events[step.col] = null
            }
            // console.log(`synth "${synth.name}" notes are ${synth.seq.events}`)
            setSteps(steps.slice())
        }}/>)}
    </>
}

export function SequencerGrid({synths, steps}) {
    let rows = synths.map((synth) => <SynthRow key={synth.name} stepCount={steps} synth={synth}/>)
    let style = {
        display:"grid",
        gridTemplateColumns:`10rem repeat(${steps},40px)`,
        gridTemplateRows: `repeat(${synths.length}, 40px)`,
    }
    return <div className={"sequencer-grid"} style={style}>{rows}</div>
}
