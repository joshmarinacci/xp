from lists import List
class TrellisWrapper():
    trellis = 0
    current_press = set()
    pressed = set()
    pressed_list = List()
    def __init__(self, trellis):
        self.trellis = trellis

    def fill(self, color):
        self.trellis.pixels.fill(color)
    def set(self, coords, color):
        if type(coords) == tuple:
            self.trellis.pixels[coords] = color
        else:
            x = coords.get1(0)
            y = coords.get1(1)
            self.trellis.pixels[(x,y)] = color

    def update(self):
        self.current_press = self.pressed
        self.pressed = set(self.trellis.pressed_keys)
        just_pressed = self.pressed - self.current_press
        #just_released = current_press - pressed
        self.pressed_list = List()
        for item in just_pressed:
            self.pressed_list.append(List(item[0],item[1]))
