import time
import board
import neopixel
from adafruit_hid.keyboard import Keyboard
from adafruit_hid.keycode import Keycode
from adafruit_debouncer import Debouncer
from digitalio import DigitalInOut, Pull
from adafruit_hid.mouse import Mouse
import usb_hid
import touchio

from tasks import TaskMaster
from common import System
from common import WHITE, BLACK, RED, GREEN, BLUE

${BOARD_IMPORTS}

mouse = Mouse(usb_hid.devices)
keyboard = Keyboard(usb_hid.devices)
tm = TaskMaster()
system = System()
def NeoPixel(id):
    return neopixel.NeoPixel(id,1)

def mouse_click(name):
    mouse.click(Mouse.LEFT_BUTTON)

def mouse_press(name):
    mouse.press(Mouse.LEFT_BUTTON)

def mouse_release(name):
    mouse.press(Mouse.LEFT_BUTTON)
    mouse.release_all()

def keyboard_press(name):
    keyboard.press(Keycode.E)

def keyboard_release_all():
    keyboard.release_all()

def modes_next():
    tm.nextMode()

def Button(pinid):
    pin = DigitalInOut(pinid)
    pin.pull = Pull.DOWN
    return Debouncer(pin)

${USER_VARIABLES}
${USER_FUNCTIONS}

tm.start()
while True:
    system.update()
    tm.cycle(0.01)

print("end everything")
