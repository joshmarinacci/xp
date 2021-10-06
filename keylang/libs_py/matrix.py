from common import BLACK, WHITE, RED, BLUE, GREEN, GRAY
from lists import List
import displayio
import math
import adafruit_fancyled.adafruit_fancyled as fancy

class Canvas(displayio.TileGrid):
    w = 10
    h = 10
    def __init__(self,x,y,w,h):
        #print("making a canvas",x,y,w,h)
        self.w = w
        self.h = h
        self.pal = [0,
        WHITE,
        0xffff00,
        0xff6500,
        RED,
        0xff0097,
        0x360097,
        0x0000ca,
        #0x0097ff,
        BLUE,
        #0x00a800,
        GREEN,
        0x006500,
        0x976536,
        0xb9b9b9,
        0x868686,
        #0x454545,
        GRAY,
        BLACK]

        colors = len(self.pal)
        self._palette = displayio.Palette(colors)
        self._palette.make_transparent(0)

        for n, color in enumerate(self.pal):
            self._palette[n] = color

        self._bitmap = displayio.Bitmap(w, h, colors)
        self.fill(BLACK)
        super().__init__(self._bitmap, pixel_shader=self._palette, x=x, y=y)

    def get_width(self):
        return self._bitmap.width
    width = property(get_width)
    def get_height(self):
        return self._bitmap.height
    height = property(get_height)
    def get_size(self):
        return List(self.width,self.height)
    size = property(get_size)

    def fill(self, col):
        c = self.pal.index(col)
        for i in range(0, self.w):   # draw the center chunk
            for j in range(0, self.h):   # draw the center chunk
                self._bitmap[i, j] = c

    def setPixel(self, xy, col):
        c = self.pal.index(col)
        x = math.floor(xy.get1(0))
        y = math.floor(xy.get1(1))
        self._bitmap[x,y] = c

    def fillRect(self,rect,col):
        c = self.pal.index(col)
        x1 = math.floor(rect.x1)
        x2 = math.floor(rect.x2)
        y1 = math.floor(rect.y1)
        y2 = math.floor(rect.y2)
        for i in range(x1,x2):   # draw the center chunk
            for j in range(y1,y2):   # draw the center chunk
                self._bitmap[i, j] = c



