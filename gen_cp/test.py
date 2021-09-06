import board
import time
import usb_hid
from digitalio import DigitalInOut,Pull
from adafruit_hid.keyboard import Keyboard
from adafruit_hid.keycode import Keycode
from adafruit_hid.mouse import Mouse
import neopixel

running = False
button = DigitalInOut(board.SWITCH)
button.switch_to_input(pull=Pull.DOWN)
button_state = False
timeout1 = time.monotonic()
keyboard = Keyboard(usb_hid.devices)
timeout2 = time.monotonic()
mouse = Mouse(usb_hid.devices)


WHITE = (255,0,255)
BLACK = (0,0,0)
AQUA  = (0,75,200)
RED   = (255,0,0)
BLUE  = (0,0,255)
GREEN   = (0,255,0)
COLOR = (255,80,0)
YELLOW = (255,255,0)
HOTPINK = (255, 105, 180)

pixels = neopixel.NeoPixel(board.NEOPIXEL, 1)

MODES = []
CURRENT_MODE = 0
def register_mode(mode, name, color):
    global MODES
    MODES.append({
        "mode":mode,
        "name":name,
        "color":color
    })

def get_mode():
    return MODES[CURRENT_MODE]

def next_mode():
    global CURRENT_MODE
    CURRENT_MODE = (CURRENT_MODE + 1) % len(MODES)
    pixels.fill(get_mode()['color'])
    print("switching to mode ", get_mode()["name"])


def do_mode_1():
    print("doing 1")

def do_mode_2():
    print("doing 2")

def do_mode_3():
    print("doing 3")

register_mode(do_mode_1,"mode1",RED)
register_mode(do_mode_2,"mode2",BLUE)
register_mode(do_mode_3,"mode3",GREEN)


while True:
    if button.value and not button_state:
        button_state = True
        print("button true")
    if not button.value and button_state:
        button_state = False
        print("button false")
        next_mode()
    get_mode()['mode']()
    time.sleep(0.1)


