import displayio
import random
import math
from adafruit_display_shapes import rect
from adafruit_display_shapes import roundrect
import adafruit_fancyled.adafruit_fancyled as fancy
from colors import ALL_COLORS
from math import floor

def randf(min,max):
    return random.uniform(min,max)
def randi(min,max):
    return random.randrange(min,max)
def pick(seq):
    return random.choice(seq)
def lerp(t,min,max):
    return ((max-min)*t) + min
def remap(val, min,max, MIN, MAX):
    t = (val - min) / (max - min)
    return ((MAX - MIN)*t) + MIN

DIRS = ['h','v']
HUES = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 0.9]
SCREEN_WIDTH = 64
SCREEN_HEIGHT = 32


class Rect:
    def __init__(self, x1, y1, x2, y2, hue, phase, freq):
        self.x1 = floor(x1)
        self.y1 = floor(y1)
        self.x2 = floor(x2)
        self.y2 = floor(y2)
        self.width = self.x2 - self.x1
        self.height = self.y2 - self.y1
        self.hue = hue
        self.phase = phase
        self.freq = freq

    def split(self, dir, amount):
        print("splitting",dir,amount)
        if dir == 'h':
            return [
                Rect(
                    self.x1, self.y1,
                    lerp(amount, self.x1, self.x2), self.y2,
                    hue=randf(0.2,0.8),
                    phase=randf(0,1),
                    freq=randf(0.2,1.5),
                    ),
                Rect(
                    lerp(amount, self.x1, self.x2),self.y1,
                    self.x2, self.y2,
                    hue=randf(0.2,0.8),
                    phase=randf(0,1),
                    freq=randf(0.2,1.5),
                    ),
            ]
        if dir == 'v':
            return [
                Rect(
                    self.x1, self.y1,
                    self.x2, lerp(amount, self.y1, self.y2),
                    hue=pick(HUES),
                    phase=randf(0,1),
                    freq=randf(0.2,1.5),
                    ),
                Rect(
                    self.x1, lerp(amount, self.y1, self.y2),
                    self.x2, self.y2,
                    hue=pick(HUES),
                    phase=randf(0,1),
                    freq=randf(0.2,1.5),
                    ),
            ]


RECTS = []

def makeRects(rect, depth):
    if depth <= 0:
        return [rect]
    dir = random.choice(DIRS)
    subrects = rect.split(dir, randf(0.2,0.8))
    return makeRects(subrects[0],depth-1) + makeRects(subrects[1],depth-1)

def setupRects(g):
    global RECTS
    print("setting up rects")
    RECTS = makeRects(Rect(
        x1=0, y1=0, x2=SCREEN_WIDTH, y2=SCREEN_HEIGHT,
        hue=pick(HUES),
        phase=0,
        freq=0.5
        ),3)
#     print("Made rects",RECTS)



count = 0
def drawRects(g):
    global RECTS
    global count
    for r in RECTS:
        r.shape = roundrect.RoundRect(r.x1,r.y1,r.width,r.height,1,
            fill=0xFF0000)
        g.append(r.shape)
    while True:
        count = count+1
        for r in RECTS:
#             theta = math.sin(count / 100.0)
            t = remap(math.sin(count/100 * (0.5+r.freq*5) + r.phase), -1, 1, 0, 1)
            if t < 0.5:
                t = t/2
            else:
                t = 1-t
            sat = lerp(t,0.2,0.8)
            lit = lerp(t,0.3,1.0)
            r.shape.fill = fancy.CHSV(r.hue, sat, lit).pack()
        yield 0.05

def stopRects(g):
    global RECTS
    global count
    print("stopping rects")
    count = 0
    for r in RECTS:
        g.remove(r.shape)
    RECTS = []




