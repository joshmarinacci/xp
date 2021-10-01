import time
import board
import neopixel
from tasks import TaskMaster
from adafruit_hid.keyboard import Keyboard
from adafruit_hid.keyboard_layout_us import KeyboardLayoutUS
from adafruit_hid.keycode import Keycode  # pylint: disable=unused-import
from adafruit_debouncer import Debouncer
from digitalio import DigitalInOut, Pull
from adafruit_hid.mouse import Mouse
import usb_hid
import touchio
${BOARD_IMPORTS}

mouse = Mouse(usb_hid.devices)
keyboard = Keyboard(usb_hid.devices)
matrixportal = MatrixPortal(
    default_bg=0xFF00FF,
    status_neopixel=board.NEOPIXEL, bit_depth=6,
    debug=True)
tm = TaskMaster()

screen = Canvas(0,0,64,32)
system = System()
g = displayio.Group()
g.append(screen)
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

start_time = time.monotonic()
_SYSTEM_running = True
while _SYSTEM_running:
    matrixportal.display.refresh(minimum_frames_per_second=0)
    matrixportal.display.show(g)
    system.update()
    tm.cycle(0.01)
#     if now > start_time + 20:
#         _SYSTEM_running = False


print("end everything")
