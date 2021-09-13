import time

class TaskMaster:
    def __init__(self):
        self.MODES = []
        self.AUTOMODES = []
        self.current = -1

    def register(self, name, runner, auto):
        mode = {
            "name":name,
            "runner":runner,
            "gen":0,
            "start":time.monotonic(),
            "delay":0,
        }
        if auto:
            self.AUTOMODES.append(mode)
        else:
            self.MODES.append(mode)

    def getCurrentMode(self):
        return self.MODES[self.current]

    def start(self):
        print("starting the taskmaster")
        self.current = 0
        self.startMode(self.getCurrentMode())
        for mode in self.AUTOMODES:
            self.startMode(mode)

    def startMode(self, mode):
        print("starting", mode["name"])
        mode['gen'] = mode["runner"]()

#     def stopMode(self, mode, g):
#         print("stopping", mode["name"])
#         mode["shutdown"](g)

    def nextMode(self):
        self.stopMode(self.getCurrentMode())
        self.current = (self.current + 1) %  len(self.MODES)
        self.startMode(self.getCurrentMode())

    def prevMode(self):
        self.stopMode(self.getCurrentMode())
        self.current = (self.current - 1) %  len(self.MODES)
        if self.current < 0:
            self.current = len(self.MODES)-1
        self.startMode(self.getCurrentMode())

    def cycleMode(self, mode):
#         print("cycling",mode['name'])
        now = time.monotonic()
        delay = mode['delay']
        start = mode['start']
        diff = now-start
        if diff > delay:
            mode['delay'] = next(mode['gen'])
            mode['start'] = now

    def cycle(self, rate):
#         print("cycling",rate)
        self.cycleMode(self.getCurrentMode())
        for mode in self.AUTOMODES:
            self.cycleMode(mode)
        time.sleep(rate)


