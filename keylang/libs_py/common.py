import time
import math
import random

WHITE   = (255,0,255)
BLACK   = (0,0,0)
RED     = (255,   0,   0)
BLUE    = (  0,   0, 255)
GREEN   = (  0, 255,   0)
YELLOW  = (255, 255,   0)
MAGENTA = (255,   0, 255)
CYAN    = (  0, 255, 255)

ALL_COLORS = [BLACK, RED, GREEN, BLUE, YELLOW, MAGENTA, CYAN]

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

def wrapop(val,min,max):
    if val < min:
        return val + (max-min)
    if val > max:
        return val - (max-min)
    return val

def wrap(val,min,max):
    if isinstance(val,List):
        out = List()
        for aa,bb,cc in zip(val.data,min.data,max.data):
            out.append(wrapop(aa,bb,cc))
        return out
    return wrapop(val,min,max)

class Obj:
    def __init__(self):
        pass

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

