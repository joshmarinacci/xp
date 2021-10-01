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
        # only run starts once
        for start in self.STARTS:
            start['runner']()
        # the rest use generators
        for loop in self.LOOPS:
            loop['gen'] = loop['runner']()
            print("initting",loop['gen'])
        # don't start modes. they are started on demand
#         for mode in self.MODES:
#             mode['gen'] = mode['runner']()
        for event in self.EVENTS:
            event['gen'] = event['runner']()
        # start the current mode
        if len(self.MODES) > 0:
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

    def cycleThing(self, event):
        now = time.monotonic()
        delay = event['delay']
        start = event['start']
        diff = now-start
        if diff > delay:
            try:
                event['delay'] = next(event['gen'])
            except StopIteration:
                event['gen'] = event['runner']()
            except TypeError:
                event['gen'] = event['runner']()
            event['start'] = now

    def cycleLoop(self,loop):
        next(loop['gen'])

    def cycle(self, rate):
        # run event handlers first
        for event in self.EVENTS:
            self.cycleThing(event)
        # run permanent loops next
        for loop in self.LOOPS:
            self.cycleThing(loop)

        # now cycle the current mode
        # start the current mode
        if len(self.MODES) > 0:
            self.cycleMode(self.getCurrentMode())
        time.sleep(rate)


