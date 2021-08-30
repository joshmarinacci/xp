import "./synth.css"
import {useEffect, useState} from 'react'
import {Sequence} from 'tone'

function range(len){
    let nums = []
    for(let i=0; i<len; i++) {
        nums.push(i)
    }
    return nums
}

function play_example(synth) {
    console.log("playing",synth.synth.name,synth.dur)
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
        // console.log("playing",time,0.1,note,synth.synth.name)
        if(synth.synth.name === 'NoiseSynth') {
            synth.synth.triggerAttackRelease("4n",time)
            return
        }
        synth.synth.triggerAttackRelease(note,synth.dur,time)
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
    return <span className={"spacer"}/>
}

function SynthControl({synth,onEdit}) {
    return <div className={"control hbox"}>
        <button onClick={()=>onEdit(synth)}>edit</button>
        <label style={{ minWidth:"50px"}} onClick={()=>play_example(synth)}>{synth.title}</label>
        <Spacer/>
        {/*<VolumeControl volume={synth.synth.volume} label={"vol"}/>*/}
    </div>

}

function fill_empty(stepCount) {
    return range(stepCount).map(i => ({on:false, col:i}))
}

function SynthRow({synth, stepCount, active_step, initial_data, onEdit}) {
    let [steps, setSteps] = useState([])
    useEffect(()=>{
        make_Seq(synth,stepCount)
        if(initial_data) {
            let data = initial_data.split("").filter(ch => ch !== " ")
            setSteps(data.map((ch,i)=>{
                if(ch === "1") {
                    synth.seq.events[i] = synth.note
                } else {
                    synth.seq.events[i] = null
                }
                return {
                    on:ch==="1",
                    col:i
                }
            }))
        } else {
            setSteps(fill_empty(stepCount))
        }
        return () => {
            synth.seq.stop()
            synth.seq.dispose()
        }
    },[synth,stepCount])
    return <>
        <SynthControl key={"control_"+synth.name} synth={synth} onEdit={onEdit}/>
        {steps.map(step => <Step step={step} col={step.col}  key={synth.name+"_"+step.col} active_step={active_step} onToggle={(step)=>{
            synth.seq.events[step.col] = null
            step.on = !step.on
            if(step.on) {
                synth.seq.events[step.col] = synth.note
            } else {
                synth.seq.events[step.col] = null
            }
            setSteps(steps.slice())
        }}/>)}
    </>
}

export function SequencerGrid({synths, steps, stepSize, rowSize, initial_data, onEdit}) {
    const [step, set_step] = useState(0)
    useEffect(()=>{
        console.log("redoing the loiop")
        let ticks = range(steps).map(()=>"C4")
        let count = 0
        let seq = new Sequence((time,note)=>{
            // console.log("main time",time)
            count++
            set_step(count%steps)
        },ticks).start(0)
        set_step(0)
        return () => {
            seq.stop()
            seq.dispose()
        }
    },[synths,steps])
    let rows = synths.map((synth,i) => <SynthRow key={synth.name} stepCount={steps} synth={synth} active_step={step} initial_data={initial_data[i]} onEdit={onEdit}/>)
    let style = {
        display:"grid",
        gridTemplateColumns:`15rem repeat(${steps},${stepSize})`,
        gridTemplateRows: `repeat(${synths.length}, ${rowSize})`,
    }
    let legend = range(steps).map((n)=><div key={"legend"+n} className={'legend ' + ((step===n)?"active":"")}>{n+1}</div>)
    return <div className={"sequencer-grid"} style={style}>{rows}<div></div>{legend}</div>
}

export function HBox({children}) {
    return <div className={'hbox'}>{children}</div>
}

export function VBox({children}) {
    return <div className={'vbox'}>{children}</div>
}
