let rooms = {
    start: {
        look: `
        You find yourself in a dark maze with many long twisty passages.
        You’re pretty sure this isn’t the mall anymore. You're definitely not
        in Sears, at least. 
        There is a dark hallway to the left. There is an even darker one to the right.
        The narrator would suggest going back the way you came, but you can’t seem to
        remember how you got here. So.. good luck?
        `,
        items: {},
        exits: {
            left: {
                look: "You look left. Yep. It’s definitely a dark hallway.",
                go: "cavern"
            },
            right: {
                look: `You look right: I’d look at the other one if I were you. 
                Super dark. Like death metal dark. Seriously. 
                Go left young man, go left.`,
                go: 'forest',
            }
        }
    },
    cavern: {
        look: `The passage leads to a larger more cavernous room, 
        probably made from an actual cavern. 
        Your first clue comes in the form of a bruise as you 
        hit your head on a stalactite. *ouch* Try to be more careful, okay?
        In the middle of the room is a small table and chair with a book on it.
        `,
        exits: {
            back: {
                go: 'start'
            }
        },
        items: {
            book: {
                use: "Most people use books by looking at them. What's your method?",
                look: `Yep, it's a book full of secrets. 
                In an ancient cursed language. 
                Probably best to put it down. But since you aren't a quick learner
                let's take a look, shall we?
                It mentions something about fire and heat is the only way to open ice and cold.
                Fascinating. I'm sure that little tidbit of knowledge won't come in handy
                later so you should probably just forget about it. kthxbye!
                `
            },
            table: {
                look: `It’s your basic wooden table. Four legs. 
                Strong enough to hold up a plot device but little more.`
            },
            chair: {
                look: 'The chair looks pretty rickety. I wouldn’t suggest using it.',
                use: 'The chair shatters into a bunch of future splinters. I told you. You players never listen to me. Brain the size of a galaxy....'
            }
        }
    },
    forest: {
        look: `You’re pretty sure this passage leads to certain doom, 
            but you go anyway. What’s up with that? 
            After a few minutes of following the path with your dying 
            flashlight you enter a clearing with an old farmhouse in the 
            middle of it. The thick trees leave no way around it. 
            It’s either the house or return down the path.
        `,
        items: {
            tree: {
                look: `Pine, fir, and other random evergreens. 
                    They don’t give a clue as to your present location. 
                    Better focus on the house, dude.`
            }
        },
        exits: {
            back: {
                go: 'start',
                look: `Yep, the same path you came on. Just as you remembered it 
                all those many seconds ago.  `
            },
            house: {
                go: 'house',
                look: `Hoo boy. It’s creepy. You’re pretty sure it was used as a set 
                from an 80s horror movie. One of those cheap ones where you can see 
                the sound guy off screen.`
            }
        }
    },
    house: {
        look: `You enter the house, being sure to knock first and completely 
            ignoring the No Trespass'n sign. Inside you see an old couch, a fireplace, 
            and door to a kitchen.`,
        items: {
            couch: {
                look: `The couch looks like it hasn't been dusted in a few centuries. 
                You decide not to sit on it. I commend your choice.`
            },
            sign: {
                look: `It's a badly handdrawn sign on a scrap of plywood. 
                Smells of tar. You decide to take a step back.`
            },
            fireplace: {
                look: `The fireplace`,
            },
            key: {
                look: 'key',
                take: true,
            }
        },
        exits: {
            back: {
                go: 'forest'
            },
            door: {
                look: `Jeez. Do I have to describe everything for you?
                    Okay, fine! It's a, um, brown wood door. Ya happy?`,
                go: 'kitchen'
            }
        }
    },
    kitchen: {
        look: `The kitchen contains an old fridge slightly ajar. 
            You can see light coming from within. But it appears to be loosely
            locked with a padlock and chains. You might be able to break it or
            open it some how. You wonder what, or who, the fridge is being
            protected from.`,
        exits: {},
        items: {},
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
        // l('room',room_name)
        let room = rooms[room_name]
        if (!room.exits) l(`${room_name} missing exits`)
        if (room.exits) {
            Object.keys(room.exits).forEach(exit_name => {
                let exit = room.exits[exit_name]
                if (!exit.look) l(`${room_name}.${exit_name} missing look`)
                if (exit.look) exit.look = clean(exit.look)
                if (!exit.go) l(`${room_name}.${exit_name} missing go`)
            })
        }
        if (!room.items) l(`${room_name} missing items`)
        if (room.items) {
            Object.keys(room.items).forEach(item_name => {
                let item = room.items[item_name]
                if (!item.look) l(`${room_name}.${item_name}  missing look`)
                if (item.look) item.look = clean(item.look)
            })
        }
        if (!room.look) l(`${room_name} missing look`)
        if (room.look) room.look = clean(room.look)
    })
    l("========== WELCOME =========")
}

function parse_command(str) {
    let [command, target] = str.toLowerCase().split(" ")
    return { command, target }
}

function run_command(cmd, state, data) {
    l("input is", cmd)
    if (cmd.command === 'help') {
        return (`You can type look, go, take, use, talk, and drop.
        ex: 
          look at the room:    look
          examine candle with: look candle
          go to the door with: go door 
        `)
    }
    if (cmd.command === 'look') {
        //check room items
        if (state.room.items[cmd.target]) {
            let item = state.room.items[cmd.target]
            if (!item.look) return `it's a ${cmd.target}. that's all`
            return item.look
        }
        //check room exits
        if (state.room.exits[cmd.target]) {
            let exit = state.room.exits[cmd.target]
            if (!exit.look) return `it's a ${cmd.target}. that's all`
            return exit.look
        }
        //look at the room itself
        if (!cmd.target || cmd.target === 'room') return state.room.look
        return `There is no ${cmd.target}`
    }
    if (cmd.command === 'use') {
        if (state.room.items[cmd.target]) {
            let item = state.room.items[cmd.target]
            if (item.use) return item.use
        }
        return `You can't use ${cmd.target}`
    }
    if (cmd.command === 'go') {
        if (state.room.exits[cmd.target]) {
            let exit = state.room.exits[cmd.target]
            if (!exit) return `there is no ${cmd.target}`
            if (!exit.go) return `you can't go ${cmd.target}`
            state.room = data[exit.go]
            return state.room.look
        } else {
            return `There is no ${cmd.target}. 
            Try going to one of: ${Object.keys(state.room.exits).join(", ")}.`
        }
    }
    return `What is ${cmd.command}?`
}


export class GameEngine {
    constructor() {
        validate(rooms)
        this.state = {
            room: rooms.start,
            bag: []
        }

    }
    startText() {
        return this.state.room.look
    }
    run(input) {
        let inp = parse_command(input)
        l("got input", input, "parsed to", inp)
        return run_command(inp, this.state, rooms)
    }
}

