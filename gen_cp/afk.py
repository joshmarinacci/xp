import time
import board
import adafruit_trellism4
import usb_hid
from adafruit_hid.keyboard import Keyboard
from adafruit_hid.keycode import Keycode
from adafruit_hid.mouse import Mouse
import math
from color_names import *
from patterns import NUM_PATTERNS

keyboard = Keyboard(usb_hid.devices)
mouse = Mouse(usb_hid.devices)
trellis = adafruit_trellism4.TrellisM4Express(rotation=270)


MODE_RUNNING = False
MODES = []
CURRENT_MODE = 0
def register_mode(mode, name, x,color,pattern,data):
    global MODES
    MODES.append({
        "mode":mode,
        "name":name,
        "color":color,
        "x":x,
        "data":data,
        'last_time':0,
        'speed':3,
        'pattern':pattern,
        'real_speed':math.pow(0.2,1),
    })

def get_mode():
    return MODES[CURRENT_MODE]

def set_mode(new_mode):
    global CURRENT_MODE
    CURRENT_MODE = new_mode % len(MODES)
    draw_mode_pattern()
    MODE_RUNNING = False

def next_mode():
    global CURRENT_MODE
    set_mode((CURRENT_MODE + 1) % len(MODES))



def light(yx, color):
    trellis.pixels[yx[0],yx[1]] = color
def scale(color, amt):
    return (color[0]*amt,color[1]*amt,color[2]*amt)



# press the E key once every speed seconds
def do_mode_1(m):
    keyboard.press(Keycode.E)
    keyboard.release_all()
    #light((0,m['x']),m['color'])
    #time.sleep(0.1)
    #light((0,m['x']),BLACK)

# press click the left mouse button once every SPEED seconds
def do_mode_2(m):
    mouse.click(Mouse.LEFT_BUTTON)
    # light((0,m['x']),m['color'])
    # time.sleep(0.1)
    # light((0,m['x']),BLACK)

def do_mode_3(m):
    keyboard.press(Keycode.F)
    keyboard.release_all()
    # light((0,m['x']),m['color'])
    # time.sleep(0.1)
    # light((0,m['x']),BLACK)

def do_mode_4(m):
    keyboard.press(Keycode.Q)
    keyboard.release_all()
    # light((0,m['x']),m['color'])
    # time.sleep(0.1)
    # light((0,m['x']),BLACK)


register_mode(do_mode_1,"mode1",0,RED,'E',{}) # func, name, x, y, color
register_mode(do_mode_2,"mode2",1,BLUE,'<',{})
register_mode(do_mode_3,"mode3",2,GREEN,'F',{})
register_mode(do_mode_4,"mode4",3,YELLOW,'Q',{})

START_BUTTON = (3,6)


SPEEDS = [
    #1000th second
    ["0.001",0.001,RED,BLACK],
    #100th second
    ["0.01",0.01,RED,BLACK],
    # 10th second
    ["0.1",0.1,RED,BLACK],
    # half second
    ["0.5",0.5,RED,BLACK],
    # one second
    [1,1.0, GREEN,BLACK],
    # five seconds
    [5,5.0, GREEN,BLACK],
    # 10 seconds
    ["10",10.0,GREEN,BLACK],
    # 1 minute
    ["1m",60.0,HOTPINK,BLACK],
    ["5m",5*60.0,HOTPINK,BLACK],
]
SPEED_UP_BUTTON   = (0,5)
SPEED_BUTTON      = (1,5)
SPEED_DOWN_BUTTON = (2,5)
light(SPEED_BUTTON, YELLOW)
light(SPEED_DOWN_BUTTON, RED)
light(SPEED_UP_BUTTON, BLUE)
last_speed_tick = 0


def draw_pattern(data, fg, bg):
    pairs = [(x,y) for x in range(4) for y in range(5)]
    for (x,y) in pairs:
        if data[y][x] == 1:
            trellis.pixels[x,y+0] = fg
        else:
            trellis.pixels[x,y+0] = bg


def draw_mode_pattern():
    mode = MODES[CURRENT_MODE]
    draw_pattern(NUM_PATTERNS[mode['pattern']],YELLOW,BLACK)

def draw_number(num,fg,bg):
    draw_pattern(NUM_PATTERNS[num],fg,bg)

def update_speed(amt):
    mode = MODES[CURRENT_MODE]
    speed = mode['speed']
    speed += amt
    if speed <0:
        speed = 0
    if speed > len(SPEEDS)-1:
        speed = len(SPEEDS)-1
    mode['speed'] = speed
    #    draw_number(mode['speed'])
    info = SPEEDS[speed]
    draw_number(info[0],info[2],info[3])
    mode['real_speed'] = info[1]

def show_speed():
    mode = MODES[CURRENT_MODE]
    speed = mode['speed']
    info = SPEEDS[speed]
    draw_number(info[0],info[2],info[3])


def blink_speed():
    global last_speed_tick
    mode = MODES[CURRENT_MODE]
    now = time.monotonic()
    if now > last_speed_tick + mode['real_speed']:
        light((mode['x'],7),BLACK)
        time.sleep(0.1)
        light((mode['x'],7),mode['color'])
        last_speed_tick = now

def toggle_running():
    global MODE_RUNNING
    MODE_RUNNING = not MODE_RUNNING
    if MODE_RUNNING:
        light(START_BUTTON, GREEN)
    else:
        light(START_BUTTON, PURPLE)

def run_mode():
    mode = MODES[CURRENT_MODE]
    if MODE_RUNNING:
        now = time.monotonic()
        if now > (mode['last_time'] + mode['real_speed']):
            mode['last_time'] = now
            mode['mode'](mode)


light(START_BUTTON, PURPLE)
current_press = set()
CURRENT_MODE = 0

def draw_mode_buttons():
    for m in MODES:
        if m == MODES[CURRENT_MODE]:
            trellis.pixels[m['x'],7] = scale(m['color'],1.0)
        else:
            trellis.pixels[m['x'],7] = scale(m['color'],0.1)

draw_mode_buttons()

while True:
    now = time.monotonic()
    # draw the mode selector buttons

    # handle the keyboard
    pressed = set(trellis.pressed_keys)
    for down in pressed - current_press:
        # use bottom row to switch modes
        if down[1] == 7:
            if down[0] < len(MODES):
                set_mode(down[0])
                draw_mode_buttons()

        if down == START_BUTTON:
            toggle_running()
        if down == SPEED_DOWN_BUTTON:
            update_speed(-1)
        if down == SPEED_UP_BUTTON:
            update_speed(1)
        if down == SPEED_BUTTON:
            show_speed()
    current_press = pressed


    if not MODE_RUNNING:
        blink_speed()
    else:
        run_mode()


