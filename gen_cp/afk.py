import time
import board
# import busio
# import audioio
# import audiocore
# import audiomixer
# #import adafruit_fancyled.adafruit_fancyled as fancy
import adafruit_trellism4
# import adafruit_adxl34x
import usb_hid
from adafruit_hid.keyboard import Keyboard
from adafruit_hid.keycode import Keycode
from adafruit_hid.mouse import Mouse
import math

running = False
keyboard = Keyboard(usb_hid.devices)
mouse = Mouse(usb_hid.devices)


WHITE = (255,0,255)
BLACK = (0,0,0)
AQUA  = (0,75,200)
RED   = (255,0,0)
BLUE    = (  0,  0,255)
GREEN   = (  0,255,  0)
COLOR = (255,80,0)
YELLOW = (255,255,0)
HOTPINK = (255, 105, 180)

#pixels = neopixel.NeoPixel(board.NEOPIXEL, 1)
trellis = adafruit_trellism4.TrellisM4Express(rotation=90)


MODE_RUNNING = False
MODES = []
CURRENT_MODE = 0
def register_mode(mode, name, x,color,data):
    global MODES
    MODES.append({
        "mode":mode,
        "name":name,
        "color":color,
        "x":x,
        "data":data,
        'last_time':0,
        'speed':1,
        'real_speed':math.pow(0.2,1),
    })

def get_mode():
    return MODES[CURRENT_MODE]

def set_mode(new_mode):
    global CURRENT_MODE
    CURRENT_MODE = new_mode % len(MODES)
    print("switching to mode ", get_mode()["name"])
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
    print("doing mode 1")
    keyboard.press(Keycode.E)
    keyboard.release_all()
    light((0,m['x']),m['color'])
    time.sleep(0.1)
    light((0,m['x']),BLACK)

# press click the left mouse button once every SPEED seconds
def do_mode_2(m):
    print("doing mode 2")
    mouse.click(Mouse.LEFT_BUTTON)
    light((0,m['x']),m['color'])
    time.sleep(0.1)
    light((0,m['x']),BLACK)

def do_mode_3(m):
    print("doing mode 3")
    keyboard.press(Keycode.F)
    keyboard.release_all()
    light((0,m['x']),m['color'])
    time.sleep(0.1)
    light((0,m['x']),BLACK)

register_mode(do_mode_1,"mode1",0,RED,{'speed':1}) # func, name, x, y, color
register_mode(do_mode_2,"mode2",1,BLUE,{})
register_mode(do_mode_3,"mode3",2,GREEN,{})

START_BUTTON = (3,7)


SPEED_UP_BUTTON = (2,6)
SPEED_BUTTON = (1,6)
SPEED_DOWN_BUTTON = (0,6)
light(SPEED_BUTTON, YELLOW)
light(SPEED_DOWN_BUTTON, RED)
light(SPEED_UP_BUTTON, BLUE)
last_speed_tick = 0

def update_speed(amt):
    mode = MODES[CURRENT_MODE]
    mode['speed'] += amt
    mode['real_speed'] = math.pow(0.2,mode['speed'])
    print("set speed to",mode['speed'], mode['real_speed'])

def blink_speed():
    global last_speed_tick
    mode = MODES[CURRENT_MODE]
    now = time.monotonic()
    if now > last_speed_tick + mode['real_speed']:
        light(SPEED_BUTTON,BLACK)
        time.sleep(0.1)
        light(SPEED_BUTTON,YELLOW)
        last_speed_tick = now

def toggle_running():
    global MODE_RUNNING
    MODE_RUNNING = not MODE_RUNNING
    if MODE_RUNNING:
        light(START_BUTTON, GREEN)
    else:
        light(START_BUTTON, BLUE)

def run_mode():
    mode = MODES[CURRENT_MODE]
    if MODE_RUNNING:
        now = time.monotonic()
        if now > (mode['last_time'] + mode['real_speed']):
            mode['last_time'] = now
            mode['mode'](mode)


light(START_BUTTON, BLUE)
current_press = set()
CURRENT_MODE = 0

while True:
    now = time.monotonic()
    # draw the mode selector buttons
    for m in MODES:
        if m == MODES[CURRENT_MODE]:
            trellis.pixels[0,m['x']] = scale(m['color'],1.0)
        else:
            trellis.pixels[0,m['x']] = scale(m['color'],0.1)

    # handle the keyboard
    pressed = set(trellis.pressed_keys)
    for down in pressed - current_press:
        print("down is",down)
        # use bottom row to switch modes
        if down[0] == 0:
            if down[1] < len(MODES):
                set_mode(down[1])

        if down == START_BUTTON:
            toggle_running()
        if down == SPEED_DOWN_BUTTON:
            update_speed(-1)
        if down == SPEED_UP_BUTTON:
            update_speed(1)
    current_press = pressed


    # run the current mode
    run_mode()

    #blink the speed button
    blink_speed()

    # sleep
    # time.sleep(0.1)


