import time
import board
from adafruit_matrixportal.matrixportal import MatrixPortal
import displayio

from tasks import TaskMaster
from randomwalk import setupRandomWalk, drawRandomWalk
from snow import setupSnow, drawSnow
from gamesprites import setupSprites, drawSprites

matrixportal = MatrixPortal(status_neopixel=board.NEOPIXEL, debug=True)
display = matrixportal.display
g = displayio.Group()

tm = TaskMaster()

# setup the random walk
# setupRandomWalk(g)
# tm.register('randomwalk',drawRandomWalk(g))

setupSnow(g)
tm.register('snow',drawSnow(g))

# setupSprites(g)
# tm.register('sprites',drawSprites(g))


while True:
    tm.cycle(0.01)
    display.refresh(minimum_frames_per_second=0)
    display.show(g)


