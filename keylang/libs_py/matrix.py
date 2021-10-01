from common import BLACK
import displayio
import adafruit_fancyled.adafruit_fancyled as fancy

class Canvas(displayio.TileGrid):
    def __init__(self,x,y,w,h):
        print("making a canvas",x,y,w,h)
        self._palette = displayio.Palette(8)
        self._palette.make_transparent(0)
#        self._palette[0] = (0,0,0) #black
        self._palette[1] = (255,0,255) #white
        self._palette[2] = (255,0,0) #red
        self._palette[3] = (0,255,0) #green
        self._palette[4] = (0,0,255) #blue
        self._palette[5] = (255,255,0) #yellow
        self._palette[6] = (255,0,2255) #magenta
        #self._palette[7] = (255,128,0) #orange
        #self._palette[8] = (0,75,200) #
        #self._palette[9] = (0,75,200) #

        self._bitmap = displayio.Bitmap(w, h, 10)
        self._palette[1] = BLACK
        self._bitmap[0,0] = 2
        for i in range(0, w):   # draw the center chunk
            for j in range(0, h):   # draw the center chunk
                self._bitmap[i, j] = 1
        super().__init__(self._bitmap, pixel_shader=self._palette, x=x, y=y)

    def fillRect(self,rect,fill):
        for i in range(rect.x1, rect.width):   # draw the center chunk
            for j in range(rect.y1, rect.height):   # draw the center chunk
                self._bitmap[i, j] = 2



