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
from color_names import WHITE, BLACK, RED, GREEN

mouse = Mouse(usb_hid.devices)
keyboard = Keyboard(usb_hid.devices)
pixels = neopixel.NeoPixel(board.NEOPIXEL, 1)
tm = TaskMaster()

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

def set_led(color):
    pixels.fill(color)

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
    tm.cycle(0.01)
    now = time.monotonic()
#     if now > start_time + 20:
#         _SYSTEM_running = False


print("end everything")
