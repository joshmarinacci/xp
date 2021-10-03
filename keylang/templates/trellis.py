import time
import board
import neopixel
from adafruit_hid.keyboard import Keyboard
from adafruit_hid.keycode import Keycode
from adafruit_debouncer import Debouncer
from digitalio import DigitalInOut, Pull
from adafruit_hid.mouse import Mouse
import usb_hid
import adafruit_trellism4

from tasks import TaskMaster
from common import System
from common import WHITE, BLACK, RED, GREEN, BLUE
from trellis import TrellisWrapper

${BOARD_IMPORTS}

mouse = Mouse(usb_hid.devices)
keyboard = Keyboard(usb_hid.devices)
tm = TaskMaster()
system = System()
# Our keypad + neopixel driver
trellis = adafruit_trellism4.TrellisM4Express(rotation=0)
canvas = TrellisWrapper(trellis)

${USER_VARIABLES}
${USER_FUNCTIONS}


tm.start()
while True:
    system.update()
    canvas.update()
    tm.cycle(0.01)

print("end everything")
