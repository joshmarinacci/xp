import time

class TaskMaster:
    def __init__(self):
        self.MODES = []
        self.EVENTS = []
        self.LOOPS = []
        self.STARTS = []
        self.current = -1

    def register_mode(self, name, runner):
        self.MODES.append({
            "name":name,
            "runner":runner,
            "gen":0,
            "start":time.monotonic(),
            "delay":0,
        })

    def register_start(self, name, runner):
        self.STARTS.append({
            "name":name,
            "runner":runner,
            "gen":0,
            "start":time.monotonic(),
            "delay":0,
        })

    def register_loop(self, name, runner):
        self.LOOPS.append({
            "name":name,
            "runner":runner,
            "gen":0,
            "start":time.monotonic(),
            "delay":0,
        })

    def register_event(self, name, runner):
        self.EVENTS.append({
            "name":name,
            "runner":runner,
            "gen":0,
            "start":time.monotonic(),
            "delay":0,
        })

    def getCurrentMode(self):
        return self.MODES[self.current]

    def start(self):
        print("starting the taskmaster")
        self.current = 0
        if len(self.MODES) < 1:
            print("not starting. no modes registered?")
            return
        # only run starts once
        for start in self.STARTS:
            start['runner']()
        # the rest use generators
        for loop_ in self.LOOPS:
            loop_['gen'] = loop_['runner']()
        # don't start modes. they are started on demand
#         for mode in self.MODES:
#             mode['gen'] = mode['runner']()
        for event in self.EVENTS:
            event['gen'] = event['runner']()
        # start the current mode
        self.startMode(self.getCurrentMode())

    def startMode(self, mode):
        print("starting", mode["name"])
        mode['gen'] = mode["runner"]()

    def stopMode(self, mode):
        print("stopping", mode["name"])
#         mode["shutdown"]()

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
        now = time.monotonic()
        delay = mode['delay']
        start = mode['start']
        diff = now-start
        if diff > delay:
            mode['delay'] = next(mode['gen'])
            mode['start'] = now

    def cycleEvent(self, event):
        next(event['gen'])

    def cycleLoop(self,loop):
        next(loop['gen'])

    def cycle(self, rate):
        # run event handlers first
        for event in self.EVENTS:
            self.cycleEvent(event)
        # run permanent loops next
        for loop in self.LOOPS:
            self.cycleLoop(loop)

        # now cycle the current mode
        self.cycleMode(self.getCurrentMode())
        time.sleep(rate)


