import "./synth.css"
import {useState} from 'react'
function range(len){
    let nums = []
    for(let i=0; i<len; i++) {
        nums.push(i)
    }
    return nums
}

function play_example(synth) {
    console.log("playing",synth)
    synth.synth.triggerAttackRelease("4n")
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

function SynthRow({synth, stepCount}) {
    let [steps, setSteps] = useState(()=>{
        return range(stepCount).map(i => ({on:false, col:i}))
    })
    return <>
        <label key={'label'+synth.name} onClick={()=>play_example(synth)}>{synth.title}</label>
        {steps.map(step => <Step step={step} col={step.col}  key={synth.name+"_"+step.col} onToggle={(step)=>{
            step.on = !step.on
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
