import readline from "readline"
let rooms = {
    start:{
        look:`You are in a maze full of long twisty passages
        There are hallways to the left and the right.
        
        Type HELP or help to get help`,
        items:{},
        exits:{
            left:{
                look:"Left. yep. It’s definitely a dark hallway.",
                go:"cavern"
            },
            right:{
                look:`Right: I’d look at the other one if I were you. 
                Super dark. Like death metal dark. Seriously. 
                Go left young man, go left.`,
                go:'house',
            }
        }
    },
    cavern:{
        look:`The passage leads to a larger more cavernous room, 
        probably made from an actual cavern. 
        Your first clue comes in the form of a bruise as you 
        hit your head on a stalactite. In the middle of the 
        room is a small table and chair with a book left open.
        `,
        exits: {
            back:{
                go:'start'
            }
        },
        items:{
            book:{
                use:"Most people use books by looking at them. What's your method?",
                look:"yep, it's a book full of secrets"
            },
            table:{
                look:`It’s your basic wooden table. Four legs. 
                Strong enough to hold up a plot device but little more.`
            },
            chair: {
                look: 'Look: the chair looks pretty rickety. I wouldn’t suggest using it.',
                use: 'The chair shatters into a bunch of future splinters. I told you.'
            }
        }
    }
}

function l(...args) {
    console.log(...args)
}
function clean(str) {
    return str.split("\n").map(s => s.trim()).join(" ")
}
function validate(rooms) {
    Object.keys(rooms).forEach(room_name => {
        l('room',room_name)
        let room = rooms[room_name]
        if(!room.exits) l("  missing exits")
        if(!room.items) l("  missing items")
        if(!room.look)  l("  room missing look")
        if(room.look) room.look = clean(room.look)
        Object.keys(room.exits).forEach(exit_name => {
            let exit = room.exits[exit_name]
            l(`   exit ${exit_name}`)
            if(!exit.look) l("     missing look")
            if(exit.look) exit.look = clean(exit.look)
            if(!exit.go)   l("     missing go")
        })
        Object.keys(room.items).forEach(item_name => {
            let item = room.items[item_name]
            l(`   exit ${item_name}`)
            if(!item.look) l("     missing look")
            if(item.look) item.look = clean(item.look)
        })
    })
    l("========== WELCOME =========")
}

function parse_command(str) {
    let [command, target] = str.toLowerCase().split(" ")
    return { command, target}
}

function run_command(cmd, state, data) {
    l("input is",cmd)
    if(cmd.command === 'help') {
        l(`You can type look, go, take, use, talk, and drop.
        ex: 
          look at the room:    look
          examine candle with: look candle
          go to the door with: go door 
        `)
        return
    }
    if(cmd.command === 'look') {
        //check room items
        if(state.room.items[cmd.target]) {
            let item = state.room.items[cmd.target]
            if(!item.look) return l(`it's a ${cmd.target}. that's all`)
            return l(item.look)
        }
        //check room exits
        if(state.room.exits[cmd.target]) {
            let exit = state.room.exits[cmd.target]
            if(!exit.look) return l(`it's a ${cmd.target}. that's all`)
            return l(exit.look)
        }
        //look at the room itself
        if(!cmd.target || cmd.target === 'room') return l(state.room.look)
        l(`there is no ${cmd.target}`)
        return
    }
    if(cmd.command === 'go') {
        if(state.room.exits[cmd.target]) {
            let exit = state.room.exits[cmd.target]
            if(!exit) return l(`there is no ${cmd.target}`)
            if(!exit.go) return l(`you can't go ${cmd.target}`)
            l(`going to`,exit)
            state.room = data[exit.go]
            l(state.room.look)
            return
        }
    }
}


async function run() {
    validate(rooms)
    let state = {
        room:rooms.start,
        bag:[]
    }
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.on('close', () => {
        // console.log('Streams Closed')
    })
    rl.on('line',(line)=>{
        // console.log("line is",line)
    })

    rl.setPrompt(">> ")

    l(state.room.look)

    async function ask(prompt) {
        rl.prompt()
        return (await rl[Symbol.asyncIterator]().next()).value;
    }

    while(true) {
        let input = await ask()
        let inp = parse_command(input)
        if(inp.command === 'exit') break
        if(inp.command === 'quit') break
        run_command(inp,state,rooms)
    }
    rl.close()
}

function sleep(dur) {
    return new Promise((res,rej)=>{
        setTimeout(res,dur)
    })
}

run().then(()=>console.log("bye!"))
