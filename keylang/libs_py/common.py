import time
import math
import random
import displayio

WHITE = (255,0,255)
BLACK = (0,0,0)
AQUA  = (0,75,200)
RED   = (255,0,0)
BLUE    = (  0,  0,255)
GREEN   = (  0,255,  0)
COLOR = (255,80,0)
YELLOW = (255,255,0)
HOTPINK = (255, 105, 180)
PURPLE = (255,0,255)
ORANGE = (255,128,0)

ALL_COLORS = [BLACK, RED, GREEN, BLUE, GREEN, YELLOW, HOTPINK, PURPLE, ORANGE]

def randf(min,max):
    return random.uniform(min,max)
def randi(min,max):
    return random.randrange(min,max)
def pick(seq):
    if isinstance(seq,List):
        return random.choice(seq.data)
    return random.choice(seq)
def lerp(t,min,max):
    return ((max-min)*t) + min
def remap(val, min,max, MIN, MAX):
    t = (val - min) / (max - min)
    return ((MAX - MIN)*t) + MIN

class Rect:
    def __init__(self, x1, y1, x2, y2):
        self.x1 = floor(x1)
        self.y1 = floor(y1)
        self.x2 = floor(x2)
        self.y2 = floor(y2)
        self.width = self.x2 - self.x1
        self.height = self.y2 - self.y1

    def split(self, dir, amount):
        print("splitting",dir,amount)
        if dir == 'h':
            return [
                Rect(
                    self.x1, self.y1,
                    lerp(amount, self.x1, self.x2), self.y2,
                    ),
                Rect(
                    lerp(amount, self.x1, self.x2),self.y1,
                    self.x2, self.y2,
                    ),
            ]
        if dir == 'v':
            return [
                Rect(
                    self.x1, self.y1,
                    self.x2, lerp(amount, self.y1, self.y2),
                    ),
                Rect(
                    self.x1, lerp(amount, self.y1, self.y2),
                    self.x2, self.y2,
                    ),
            ]

def remap(val, min, max, MIN, MAX):
    t = (val - min) / (max - min)
    return ((MAX - MIN) * t) + MIN


def sine1(v):
    return remap(math.sin(v), -1, 1, 0,1)

def floor(v):
    return math.floor(v)

class System:
    time = 0
    startTime = 0
    currentTime = 0
    def __init__(self):
        self.time = 0
        self.startTime = time.monotonic()
        self.currentTime = time.monotonic
    def update(self):
        self.currentTime = time.monotonic()
        self.time = self.currentTime - self.startTime


class List:
    def __init__(self, *args):
        self.data = []
        for val in args:
            self.data.append(val)

    def get_length(self):
        return len(self.data)

    length = property(get_length)

