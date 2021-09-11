import displayio
import random
import math


RANDOM = {}
SCREEN_WIDTH = 64
SCREEN_HEIGHT = 32
def setupRandomWalk(g):
    COLOR_COUNT = 10
    bitmap = displayio.Bitmap(SCREEN_WIDTH,SCREEN_HEIGHT,COLOR_COUNT)
    palette = displayio.Palette(COLOR_COUNT)
    palette[0] = 0x000000
    palette[1] = 0xFF0000
    palette[2] = 0x00FF00
    palette[3] = 0x0000FF
    palette[4] = 0xFFFF00
    palette[5] = 0x00FFFF
    palette[6] = 0xFF00FF
    palette[7] = 0xFFFFFF
    palette[8] = 0x880000
    palette[9] = 0x008800

    RANDOM['dots'] = []
    for i in range(20):
        RANDOM['dots'].append({
            "x":random.randrange(0,SCREEN_WIDTH),
            "y":random.randrange(0,1),
            "vx":random.uniform(-0.1,0.1),
            "vy":random.uniform(0.5,1.5),
            "color":random.randrange(len(palette))
        })
    #clear screen
    bitmap_tile = displayio.TileGrid(bitmap,pixel_shader=palette)
    RANDOM['bitmap'] = bitmap
    bitmap.fill(0)
    g.append(bitmap_tile)

def drawRandomWalk(g):
    bitmap = RANDOM['bitmap']
    while True:
        #bitmap.fill(0)
        for dot in  RANDOM['dots']:
            # print("dot",dot)
            dot['x'] += dot['vx']
            dot['y'] += dot['vy']
            if dot['x'] < 0:
                 dot['x'] = SCREEN_WIDTH -1
            if dot['x'] >= SCREEN_WIDTH:
                dot['x'] = 0
            if dot['y'] < 0:
                 dot['y'] = SCREEN_HEIGHT -1
            if dot['y'] >= SCREEN_HEIGHT:
                dot['y'] = 0
            x = math.floor(dot['x'])
            y = math.floor(dot['y'])
            bitmap[x,y] = dot['color']
        yield 0.1
