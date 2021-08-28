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

function Step({col, onToggle, step, active_step}) {
    const cls = {
        step:true,
        four:step.col%4===0,
        on:step.on,
        active:step.col === active_step
    }
    return <div className={cls2str(cls)} onClick={()=>onToggle(step)}/>
}

function make_Seq(synth, stepCount) {
    // console.log("made sequence for ",synth.name)
    let events = range(stepCount).map(i => null)
    let seq = new Sequence((time,note)=>{
        // console.log("playing",time,note,synth.synth.name)
        if(synth.synth.name === 'NoiseSynth') {
            synth.synth.triggerAttackRelease("4n",time)
            return
        }
        synth.synth.triggerAttackRelease(note,0.1,time)
    },events).start(0)
    synth.seq = seq
}
function VolumeControl({volume,label}) {
    const [vol, set_vol] = useState(volume.value)
    return <>
        <label>{label}</label>
        <input type={"number"} min={-40} max={40} value={""+Math.floor(vol)} step={1} onChange={(e)=>{
            let v = parseInt(e.target.value)
            set_vol(v)
            volume.value = v
        }
        }/>
        {/*<label>{Math.floor(vol)}</label>*/}
    </>
}

export function Spacer() {
    return <span className={"spacer"}></span>
}

function SynthControl({synth}) {
    const [volume, set_volume] = useState(synth.synth.volume.value)
    return <div className={"control hbox"}
    >
        <label style={{ minWidth:"50px"}} onClick={()=>play_example(synth)}>{synth.title}</label>
        <Spacer/>
        <VolumeControl volume={synth.synth.volume} label={"vol"}/>
    </div>

}

function SynthRow({synth, stepCount, active_step}) {
    let [steps, setSteps] = useState(()=>{
        return range(stepCount).map(i => ({on:false, col:i}))
    })
    useEffect(()=>{
        make_Seq(synth,stepCount)
    },[synth])
    return <>
        <SynthControl key={"control_"+synth.name} synth={synth}/>
        {steps.map(step => <Step step={step} col={step.col}  key={synth.name+"_"+step.col} active_step={active_step} onToggle={(step)=>{
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
    const [step, set_step] = useState(0)
    useEffect(()=>{
        let ticks = range(steps).map(()=>"C4")
        let count = 0
        let seq = new Sequence((time,note)=>{
            count++
            console.log(count)
            set_step(count%steps)
        },ticks).start(0)
        return () => {
            console.log("have to shut it down")
        }
    },[synths,steps])
    let rows = synths.map((synth) => <SynthRow key={synth.name} stepCount={steps} synth={synth} active_step={step}/>)
    let style = {
        display:"grid",
        gridTemplateColumns:`10rem repeat(${steps},40px)`,
        gridTemplateRows: `repeat(${synths.length}, 40px)`,
    }
    let legend = range(steps).map((n)=><div key={"legend"+n} className={'legend ' + ((step===n)?"active":"")}>{n+1}</div>)
    return <div className={"sequencer-grid"} style={style}>{rows}<div></div>{legend}</div>
}
