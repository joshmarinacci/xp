import displayio
import random
import math
from math import floor

class Grid:
    def __init__(self, w,h):
        self.w = w
        self.h = h
        self.bitmap = displayio.Bitmap(SCREEN_WIDTH,SCREEN_HEIGHT,16)
        self.fill(0)
    def fill(self, value):
        # self.data = []
        # self.data = [value for i in range(self.w*self.h)]
        self.bitmap.fill(value)
    def set(self,x,y,value):
        self.bitmap[x,y] = value
        # n = self.xyToIndex(x,y)
        # self.data[n] = value
    def get(self,x,y):
        # n = self.xyToIndex(x,y)
        # return self.data[n]
        return self.bitmap[x,y]
    def xyToIndex(self,x,y):
        return x + y * self.w

BLACK = 0
RED = 1
GREEN = 2
BLUE = 3
WHITE = 7
SCREEN_WIDTH = 32
SCREEN_HEIGHT = 32
COLOR_COUNT = 10
FLAKE_COUNT = 50

snow = []
bitmap = 0

grid = Grid(SCREEN_WIDTH,SCREEN_HEIGHT)
grid.fill(0)

def resetSnow():
    for flake in snow:
        flake['alive'] = True
        flake['y'] = 0
    grid.fill(BLACK)
    half = math.floor(SCREEN_WIDTH/2)
    left = random.randrange(0,half)
    right = random.randrange(half, SCREEN_WIDTH)
    top = random.randrange(half, SCREEN_HEIGHT-2)
    for n in range(left,right):
        grid.set(n,top,RED)
    for n in range(0,SCREEN_WIDTH):
        grid.set(n,SCREEN_HEIGHT-1,RED)

def setupSnow():
    global bitmap
    print("setting up snow")
    bitmap = displayio.Bitmap(SCREEN_WIDTH,SCREEN_HEIGHT,COLOR_COUNT)
    palette = displayio.Palette(COLOR_COUNT)
    palette[BLACK] = 0x000000
    palette[RED] = 0xFF0000
    palette[GREEN] = 0x00FF00
    palette[BLUE] = 0x0000FF
    palette[4] = 0xFFFF00
    palette[5] = 0x00FFFF
    palette[6] = 0xFF00FF
    palette[WHITE] = 0xFFFFFF
    palette[8] = 0x880000
    palette[9] = 0x008800


    for i in range(FLAKE_COUNT):
        snow.append({
            "x":random.randrange(0,SCREEN_WIDTH),
            "y":random.randrange(0,math.floor(SCREEN_HEIGHT/2)),
            "vx":random.uniform(-0.1,0.1),
            "vy":random.uniform(0.5,1),
            "alive":True,
        })
    resetSnow()
    bitmap_tile = displayio.TileGrid(bitmap,pixel_shader=palette)
    return bitmap_tile

def wrap(val, min, max):
    if val < min:
        return max-1
    if val >= max:
        return min
    return val

def drawSnow():
    while True:
        # bitmap.fill(BLACK)
        live_count = 0
        for flake in snow:
            if not flake['alive']:
                continue
            if flake['alive']:
                live_count += 1
                ox = math.floor(flake['x'])
                oy = math.floor(flake['y'])
                flake['x'] = wrap(flake['x'] + flake['vx'],0,SCREEN_WIDTH)
                nx = math.floor(flake['x'])
                flake['y'] = flake['y'] + flake['vy']
                ny = math.floor(flake['y'])
                if ny >= SCREEN_HEIGHT:
                    ny = 0
                    flake['y'] = ny
                if ny > oy:
                    val = grid.get(nx,ny)
                    if val > 0:
                        if oy == 0:
                            flake['alive'] = False
                        grid.set(ox,oy,BLUE) 
                        flake['y'] = 0
                        flake['x'] = random.randrange(0,SCREEN_WIDTH)


        # draw the snowbanks and boundaries
        bitmap.blit(0,0, grid.bitmap)
        # for x in range(0,grid.w):
        #     for y in range(0,grid.h):
        #         v = grid.get(x,y)
        #         if v >  BLACK:
        #             bitmap[x,y] = v

        # draw the living flakes
        for flake in snow:
            if not flake['alive']:
                continue
            bitmap[floor(flake['x']),floor(flake['y'])] = WHITE


        if live_count <= FLAKE_COUNT/4:
            resetSnow()
        # print("live",live_count)
        yield 0.1