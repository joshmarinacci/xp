console.log("prepping for reload")

const LOAD_TIME = new Date()

function sleep(dur) {
    return new Promise((res,rej)=>{
        setTimeout(()=>{
            res()
        },dur)
    })
}

async function check_changed() {
    // console.log("checking")
    let info = await fetch("./lastmod.json").then(re=>re.json())
    // console.log("final output",info)
    let last_mod = new Date(info.mod)
    // console.log("comparing",last_mod, LOAD_TIME)
    if(last_mod.getTime() > LOAD_TIME.getTime()) {
        // await sleep(500) //wait 500ms just in case it's still writing the file
        document.location.reload()
    }
}

setInterval(check_changed,1000)
