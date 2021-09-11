import displayio
import random
import math
import adafruit_imageload

def foo():
    print("foin")

# print("importing sprites")
# SCREEN_WIDTH = 64
# SCREEN_HEIGHT = 32
# COLOR_COUNT = 4


SPRITES = [
    {
        "name":"flower",
        "url":"./sprites/flower.bmp",
        "w":16,
        "h":16,
        "frameCount":4,
        "frameHGap":0,
        "currentFrame":0
    },
    {
        "name":"coins",
        "url":"./sprites/coins.bmp",
        "w":16,
        "h":16,
        "frameCount":4,
        "frameHGap":0,
        "currentFrame":0
    },
    {
        "name":"star",
        "url":"./sprites/star.bmp",
        "w":16,
        "h":16,
        "frameCount":4,
        "frameHGap":0,
        "currentFrame":0
    },
    {
        "name":"small_mario",
        "url":"./sprites/small_mario_running.bmp",
        "w":16,
        "h":16,
        "frameCount":3,
        "frameHGap":1,
        "currentFrame":0
    },
    {
        "name":"small_swim_mario",
        "url":"./sprites/small_mario_swimming.bmp",
        "w":16,
        "h":16,
        "frameCount":5,
        "frameHGap":1,
        "currentFrame":0
    },
    {
        "name":"running_fire_mario",
        "url":"./sprites/fire_mario_running.bmp",
        "w":16,
        "h":32,
        "frameCount":3,
        "frameHGap":1,
        "currentFrame":0
    }
]

CURRENT_SPRITE = 5

def setupSprites(g):
    for sprite in SPRITES:
        image, palette = adafruit_imageload.load(
            sprite["url"], bitmap=displayio.Bitmap, palette=displayio.Palette
        )
        sprite['tile_grid'] = displayio.TileGrid(image, pixel_shader=palette,
            width=1,
            height=1,
            tile_width=sprite['w'],
            tile_height=sprite['h'])

def drawSprites(g):
    global CURRENT_SPRITE
    global SPRITES
    while True:
        sprite = SPRITES[CURRENT_SPRITE]
        g.append(sprite['tile_grid'])
        for count in range(0,10):
            sprite['currentFrame'] = sprite['currentFrame'] + 1
            sprite['tile_grid'][0] = sprite['currentFrame'] % sprite['frameCount']
            yield 0.25
        g.remove(sprite['tile_grid'])
        CURRENT_SPRITE = (CURRENT_SPRITE + 1) % len(SPRITES)


def stopSprites(g):
    global CURRENT_SPRITE
    global SPRITES
    print("stopping the sprites")
    sprite = SPRITES[CURRENT_SPRITE]
    g.remove(sprite['tile_grid'])
    for sprite in SPRITES:
        sprite['tile_grid'] = 0


