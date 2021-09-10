import time
import math
import board
import random
from tasks import TaskMaster
from randomwalk import setupRandomWalk, drawRandomWalk
from snow import setupSnow, drawSnow

from adafruit_matrixportal.matrixportal import MatrixPortal
import displayio

matrixportal = MatrixPortal(status_neopixel=board.NEOPIXEL, debug=True)
display = matrixportal.display
g = displayio.Group()

tm = TaskMaster()

# setup the random walk
g.append(setupRandomWalk())
tm.register('randomwalk',drawRandomWalk())

g.append(setupSnow())
tm.register('snow',drawSnow())



while True:
    tm.cycle(0.01)
    display.refresh(minimum_frames_per_second=0)
    display.show(g)


