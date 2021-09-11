import time

class TaskMaster:
    def __init__(self):
        self.MODES = []
        self.AUTOMODES = []
        self.current = -1

    def register(self, name, setup, runner, shutdown, auto):
        mode = {
            "name":name,
            "setup":setup,
            "runner":runner,
            "shutdown":shutdown,
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

    def start(self, g, overlay):
        self.g = g
        self.overlay = overlay
        self.current = 0
        self.startMode(self.getCurrentMode(),self.g)
        for mode in self.AUTOMODES:
            self.startMode(mode,self.overlay)

    def startMode(self, mode, g):
        print("starting", mode["name"])
        mode["setup"](g)
        mode['gen'] = mode["runner"](g)

    def stopMode(self, mode, g):
        print("stopping", mode["name"])
        mode["shutdown"](g)

    def nextMode(self):
        self.stopMode(self.getCurrentMode(),self.g)
        self.current = (self.current + 1) %  len(self.MODES)
        self.startMode(self.getCurrentMode(),self.g)

    def prevMode(self):
        self.stopMode(self.getCurrentMode(),self.g)
        self.current = (self.current - 1) %  len(self.MODES)
        if self.current < 0:
            self.current = len(self.MODES)-1
        self.startMode(self.getCurrentMode(),self.g)

    def cycleMode(self, mode):
        now = time.monotonic()
        delay = mode['delay']
        start = mode['start']
        diff = now-start
        if diff > delay:
            mode['delay'] = next(mode['gen'])
            mode['start'] = now

    def cycle(self, rate):
        self.cycleMode(self.getCurrentMode())
        for mode in self.AUTOMODES:
            self.cycleMode(mode)
        time.sleep(rate)


