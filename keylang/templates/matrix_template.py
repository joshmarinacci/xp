import time
import board
import neopixel
import displayio
from adafruit_matrixportal.matrixportal import MatrixPortal
from tasks import TaskMaster
from digitalio import DigitalInOut, Pull
from common import WHITE, BLACK, RED, GREEN, BLUE, remap, sine1, floor, System, pick, Obj, randi, randf
from lists import List, range, wrap, add, Rect
from matrix import Canvas

${BOARD_IMPORTS}

matrixportal = MatrixPortal(
    default_bg=0xFF00FF,
    status_neopixel=board.NEOPIXEL, bit_depth=6,
    debug=True)
tm = TaskMaster()

screen = Canvas(0,0,64,32)
system = System()
g = displayio.Group()
g.append(screen)

${USER_VARIABLES}
${USER_FUNCTIONS}

tm.start()

while True:
    system.update()
    tm.cycle(0.01)
    matrixportal.display.refresh(minimum_frames_per_second=0)
    matrixportal.display.show(g)


print("end everything")
