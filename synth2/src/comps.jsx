import "./synth.css"
import {useEffect, useState} from 'react'
import {Loop, Sequence, Transport, start} from 'tone'

export function range(len){
    let nums = []
    for(let i=0; i<len; i++) {
        nums.push(i)
    }
    return nums
}

function play_example(synth) {
    if(synth.synth.name === 'MembraneSynth') {
        synth.synth.triggerAttackRelease('C2',synth.dur)
        return
    }
    synth.synth.triggerAttackRelease(synth.dur)
}

export function cls2str(obj) {
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

function SynthRow({synth, stepCount, row, active_step, initial_data, onEdit, toggleStep, steps}) {
    // console.log("making row with data",steps)
    if(!steps) return <>loading</>
    // let [steps, setSteps] = useState([])
    // useEffect(()=>{
    //     // make_Seq(synth,stepCount)
    //     // console.log("rebuilding from initial_data")
    //     if(initial_data) {
    //         let data = initial_data.split("").filter(ch => ch !== " ")
    //         setSteps(data.map((ch,i)=>{
    //             if(ch === "1") {
    //                 synth.seq.events[i] = synth.note
    //             } else {
    //                 synth.seq.events[i] = null
    //             }
    //             return {
    //                 on:ch==="1",
    //                 col:i
    //             }
    //         }))
    //     } else {
    //         setSteps(fill_empty(stepCount))
    //     }
    //     return () => {
    //         // synth.seq.stop()
    //         // synth.seq.dispose()
    //     }
    // },[synth,stepCount])
    return <>
        <SynthControl key={"control_"+synth.name} synth={synth} onEdit={onEdit}/>
        {steps.map((step,col) => <Step step={step} col={step.col}  key={synth.name+"_"+step.col} active_step={active_step} onToggle={(step)=>{
            // step.on = !step.on
            toggleStep(col,row,step.on)
            // synth.seq.events[step.col] = null
            // if(step.on) {
            //     synth.seq.events[step.col] = synth.note
            // } else {
            //     synth.seq.events[step.col] = null
            // }
            // setSteps(steps.slice())
        }}/>)}
    </>
}

function gen_grid(rows,cols) {
    let grid = []
    range(rows).forEach(()=>{
        let arr = range(cols).map(i => {
            return {
                on:false,
                col:i
            }
        })
        grid.push(arr)
    })
    return grid
}

export function SequencerGrid({synths, stepCount, stepSize, rowSize, initial_data, onEdit}) {
    const [step, set_step] = useState(0)
    const [loop, set_loop] = useState(null)
    const [playing, set_playing] = useState(false)
    const [steps, set_steps] = useState([[]])
    useEffect(()=>{
        set_steps(gen_grid(synths.length,stepCount))
    },[synths,stepCount])
    useEffect(()=>{
        let grid = gen_grid(synths.length, stepCount)
        initial_data.forEach((str_row,j) => {
            let row = str_row.split("").filter(ch => ch !== " ")
            row.map((ch,i)=>{
                if(ch === "1") {
                    grid[j][i].on = true
                }
            })
        })
        set_steps(grid)
    },[initial_data])
    function toggle_sequencer() {
        if(playing) {
            set_playing(false)
            loop.stop()
        } else {
            set_playing(true)
            let count = 0
            set_loop(new Loop((time)=>{
                let step = count%stepCount
                set_step(step)
                synths.forEach((syn,row) => {
                    let data = steps[row]
                    let cell = data[step]
                    if(cell.on) {
                        if(syn.synth.name === "NoiseSynth") {
                            syn.synth.triggerAttackRelease(syn.dur,time)
                        } else {
                            syn.synth.triggerAttackRelease(syn.note, syn.dur, time)
                        }
                    }
                })
                count++
            },'8n').start())
        }
    }
    let rows = synths.map((synth,i) => <SynthRow key={synth.name} stepCount={stepCount} synth={synth} active_step={step}
                                                 // initial_data={initial_data[i]}
        steps={steps[i]}
                                                 onEdit={onEdit} row={i} toggleStep={(col,row,on)=>{
        // console.log("toggling",row,col,on)
        steps[row][col].on = !steps[row][col].on
        set_steps(steps.slice())
    }
    }/>)
    let style = {
        display:"grid",
        gridTemplateColumns:`15rem repeat(${stepCount},${stepSize})`,
        gridTemplateRows: `repeat(${synths.length}, ${rowSize})`,
    }
    let legend = range(stepCount).map((n)=><div key={"legend"+n} className={'legend ' + ((step===n)?"active":"")}>{n+1}</div>)


    return <div className={"sequencer-grid"} style={style}>{rows}<HBox>
        <button onClick={toggle_sequencer}>{playing?"pause":"play"}</button>
    </HBox>{legend}</div>
}

export function HBox({children}) {
    return <div className={'hbox'}>{children}</div>
}

export function VBox({children}) {
    return <div className={'vbox'}>{children}</div>
}

export function BPMControl() {
    const [value, set_value] = useState(Transport.bpm.value)
    return <div className={"hbox control"}>
        <label>BPM</label>
        <input type={"range"} min={30} max={240} value={"" + Math.floor(value)} step={1}
               onChange={(e) => {
                   let v = Math.floor(parseFloat(e.target.value))
                   set_value(v)
                   Transport.bpm.value = v
               }}/>
        <label style={{minWidth: "30px"}}>{Math.floor(Transport.bpm.value)}</label>
    </div>
}

export function PlayPauseButton() {
    let [state, setState] = useState(Transport.state)
    let text = "???"
    if (state === "started") text = "on"
    if (state === "stopped") text = "off"
    return <button style={{
        fontSize: '200%',
        minWidth: '3em'
    }} onClick={async () => {
        if (Transport.state === "started") {
            Transport.stop()
        } else {
            await start()
            Transport.start()//0,0)
            console.log("audio is ready now")
        }
        console.log("new state is", Transport.state)
        setState(Transport.state)
    }}>{text}</button>
}
