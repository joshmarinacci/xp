import time
import board
import neopixel
from tasks import TaskMaster
from digitalio import DigitalInOut, Pull
import touchio
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
