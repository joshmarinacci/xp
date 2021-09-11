import time
import board
from adafruit_matrixportal.matrixportal import MatrixPortal
import displayio
from digitalio import DigitalInOut, Direction, Pull
from tasks import TaskMaster
from randomwalk import setupRandomWalk, drawRandomWalk, stopRandomWalk
from snow import setupSnow, drawSnow, stopSnow
from gamesprites import setupSprites, drawSprites, stopSprites
from adafruit_debouncer import Debouncer

# how often to change modes automatically (in seconds)
MODE_CYCLE_TIME = 1*60 # 1 minute
matrixportal = MatrixPortal(status_neopixel=board.NEOPIXEL, debug=True)
display = matrixportal.display
g1 = displayio.Group()
g2 = displayio.Group()


tm = TaskMaster()
tm.register("drips",setupRandomWalk, drawRandomWalk, stopRandomWalk, False)
tm.register('snow',setupSnow, drawSnow, stopSnow, False)
tm.register("sprites",setupSprites, drawSprites, stopSprites, False)


bitmap = 0
def setupLabel(g):
    global bitmap
#     bitmap = displayio.Bitmap(5, 5,3)
#     palette = displayio.Palette(3)
#     palette[0] = 0x000000
#     palette[1] = 0xFFFFFF
#     palette[2] = 0xFF0000
#     bitmap_tile = displayio.TileGrid(bitmap,pixel_shader=palette)
#     bitmap.fill(1)
#     g.append(bitmap_tile)

def updateLabel(g):
    while True:
        now = time.monotonic()
#         bitmap[0,0] = 2
#         print("g1 layers", len(g1))
#         print("g2 layers", len(g2))
        yield(1)

def stopLabel(g):
    print("stopping the label")

tm.register("label", setupLabel, updateLabel, stopLabel, True)

up_button_pin = DigitalInOut(board.BUTTON_UP)
up_button_pin.switch_to_input(pull=Pull.UP)
up_button = Debouncer(up_button_pin)
down_button_pin = DigitalInOut(board.BUTTON_DOWN)
down_button_pin.switch_to_input(pull=Pull.UP)
down_button = Debouncer(down_button_pin)


tm.start(g1,g2)

g3 = displayio.Group()
g3.append(g1)
g3.append(g2)

start_time = time.monotonic()
while True:
    tm.cycle(0.01)
    display.refresh(minimum_frames_per_second=0)
    display.show(g3)
    now = time.monotonic()
    if now > start_time + MODE_CYCLE_TIME:
        print("going to the next")
        tm.nextMode()
        start_time = now
    up_button.update()
    down_button.update()
    if up_button.fell:
        tm.nextMode()
    if down_button.fell:
        tm.prevMode()


