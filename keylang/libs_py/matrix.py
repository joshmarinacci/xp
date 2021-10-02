from common import BLACK
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
        self._palette = displayio.Palette(9)
        self._palette.make_transparent(0)
        self._palette[1] = WHITE #white
        self._palette[2] = RED #red
        self._palette[3] = GREEN #green
        self._palette[4] = BLUE #blue
        self._palette[5] = YELLOW #yellow
        self._palette[6] = MAGENTA #magenta
        self._palette[7] = CYAN #magenta
        self._palette[8] = BLACK #black

        self._bitmap = displayio.Bitmap(w, h, 9)
        for i in range(0, w):   # draw the center chunk
            for j in range(0, h):   # draw the center chunk
                self._bitmap[i, j] = 1
        super().__init__(self._bitmap, pixel_shader=self._palette, x=x, y=y)

    def get_width(self):
        return self._bitmap.width
    width = property(get_width)

    def fill(self: color):
        for i in range(0, self.w):   # draw the center chunk
            for j in range(0, self.h):   # draw the center chunk
                self._bitmap[i, j] = 1

    def setPixel(self, xy, color):
        x = math.floor(xy.get1(0))
        y = math.floor(xy.get1(1))
        self._bitmap[x,y] = color

    def fillRect(self,rect,color):
        x1 = math.floor(rect.x1)
        x2 = math.floor(rect.x2)
        y1 = math.floor(rect.y1)
        y2 = math.floor(rect.y2)
        for i in range(x1,x2):   # draw the center chunk
            for j in range(y1,y2):   # draw the center chunk
                self._bitmap[i, j] = color



