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
                `,
                take:true
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
                look: `The fireplace clearly hasn't been used in ages, nor cleaned. As you scour the soot without 
                touching you see a tiny glint of metal. A key perhaps? Gum wrappers? Tiny crashed UFO? 
                However will you find out?!`,
            },
            key: {
                look: `You find a rusted key with wear marks on the shaft. Someone has recently used the 
                key then rehidden it. Why, you ask yourself? Why are you wasting
                a perfectly good saturday afternoon playing this game. That's an excellent question.
                In any case, you think you can take the key as long as you don't care about dirty hands.
                `,
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
            locked with a padlock and chains. Otherwise the kitchen is empty except for a dusty cupboard to the side.`,
        exits: {
            cupboard: {
                look:'A cupboard even dustier than the fridge. Go check it out.',
                go:`cupboard`,
            },
            fridge: {
                look:`a smelly old fridge. Gonna go there?`,
                go:`fridge`,
            },
            door: {
                look:'the door that goes back to the front room',
                go:`kitchen`,
            }
        },
        items:{},
    },
    fridge:{
        look:`You examine the chain and lock on the fridge. Fascinating, captain! 
                You might be able to break the chain or open it some how. 
                You wonder what, or who, the fridge is being
                protected from.`,
        exits:{
            cupboard: {
                look:'A cupboard even dustier than the fridge. Go check it out.',
                go:`cupboard`,
            },
            kitchen: {
                look:`The rest of the dusty old kitchen.`,
                go:`kitchen`,
            }
        },
        items: {
            chain:{
                look:`Yep, it's chain with a lock. Got a hole. If only you had a key. Hmm. If only. Anyway, TTFN.`,
            },
            pudding: {
                look:`"Hey!" the pudding says. "Hey! You there!" \n\n
                You stutter and stammer and stare at the quivering mass of stuff that should not be.
                "Hey man. Can you get me some whip cream?" it asks.
                `,
            },
        },
        actions: {
            'key': {
                look: `You place the key in the lock, twist, and the chains clatter to the floor. The stanky fridge opens and
                        you look within. \n\n The horror. The horror!\n\n You see a giant blob of quivering brown goo... oh wait. 
                        Nevermind. It's just a vat of pudding. The pudding says hi.`,
                use: {
                    target: 'fridge',
                    set: {
                        key: 'look',
                        value: 'The fridge is open and contains a vat of talking pudding. Now *thats* not something you see every day.'
                    }
                }
            },
            'cream':{
                look:`You spray whipped cream on the pudding. "Ah", it says. "That feels better. 
                I was burning up here!"
                Suddenly the light in the fridge begins to brighten, becoming more and more glaring until
                it overwhelms your senses.  You feel a pain in your head and drop to the floor, holding
                your ears and squeezing your eyes tightly closed.
                When the pain finally ends you open your eyes and see you are back in the appliances
                department. You walk around, feeling the fresh spring air and pushing buttons on
                a near by stove.  It feels good to be back in the real world.  The lights on the stove begin
                to glow and you smell the scent of whipped cream.. Then it hits you.
                 Sears went bankrupt years ago. Where are you really?!!!
                 
                \n\n
                The End?  
                `
            }
        },
    },
    cupboard: {
        look:`The cupboard is empty except for a spray can of whipp-ed cream. Dust everywhere. Like serious. 
        Who owns this dump? Clearly someone who likes their cream to be whipped.`,
        items:{
            cream: {
                look:`Dispite the dust surrounding every surface of the cupboard, the can itself is both clean and still chilled.
                Clearly the work of the devil. I've seen these kinds of things before. Back in
                my day we used to call it Devil Whip, because that was.... You know what? Nevermind. 
                No more long rambling stories for you.`,
                take:true,
            }
        },
        exits:{
            kitchen: {
                look:'Still a kitchen.',
                go:'kitchen',
            },
            fridge:{
                look:"The fridge is still there. What are you going to do about it?",
                go:'fridge',
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
        if (!room.actions) l(`${room_name} missing actions`)
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
        //check bag
        if (state.bag[cmd.target]) {
            let item = state.bag[cmd.target]
            if (!item.look) return `it's a ${cmd.target}. that's all`
            return item.look
        }

        //look at the room itself
        if (!cmd.target || cmd.target === 'room') return state.room.look
        return `There is no ${cmd.target}`
    }
    if (cmd.command === 'use') {
        //check the room for an item to use
        if (state.room.items[cmd.target]) {
            let item = state.room.items[cmd.target]
            if (item.use) return item.use
        }
        //check the bag for an item to use
        if (state.bag[cmd.target]) {
            let item = state.bag[cmd.target]
            //check if you can use the item
            if(item.use) {
                return `using ${cmd.target}`
            }
            //check if the room has an action to use the item
            if(state.room.actions) {
                let action = state.room.actions[cmd.target]
                if (action) {
                    console.log("we have a valid action", action)
                    //do the action
                    console.log("doing ", action.use)
                    if (action.use && action.use.set) {
                        let target = data[action.use.target]
                        target[action.use.set.key] = action.use.set.value
                    }
                    //return the look
                    return action.look
                }
            }

        }
        return `You can't use ${cmd.target}`
    }
    if (cmd.command === 'take') {
        if (state.room.items[cmd.target]) {
            let item = state.room.items[cmd.target]
            console.log("Item is",item)
            if (item.take) {
                state.bag[cmd.target] = item
                return `You put the ${cmd.target} in your bag.`
            }
        }
        return `You can't take ${cmd.target}.`
    }
    if (cmd.command === 'bag') {
        return `Your bag contains ${Object.keys(state.bag).join(", ")}`
    }
    if (cmd.command === 'go') {
        if (state.room.exits[cmd.target]) {
            let exit = state.room.exits[cmd.target]
            if (!exit) return `there is no ${cmd.target}`
            if (!exit.go) return `you can't go ${cmd.target}`
            state.room = data[exit.go]
            return state.room.look
        } else {
            return `You can't go to the ${cmd.target}. 
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
            bag: {}
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

