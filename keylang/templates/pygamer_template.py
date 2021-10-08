import time
import board
import neopixel
from adafruit_hid.keyboard import Keyboard
from adafruit_hid.keycode import Keycode
from adafruit_debouncer import Debouncer
from digitalio import DigitalInOut, Pull
from adafruit_hid.mouse import Mouse
import usb_hid

from tasks import TaskMaster
from common import System
from common import WHITE, BLACK, RED, GREEN, BLUE

print("py-gamer end everything")

${BOARD_IMPORTS}

tm = TaskMaster()
system = System()
# Our keypad + neopixel driver

${USER_VARIABLES}
${USER_FUNCTIONS}

tm.start()
while True:
    system.update()
    canvas.update()
    tm.cycle(0.01)

print("pygamer end everything")
