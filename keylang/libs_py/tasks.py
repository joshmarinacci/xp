import time

STOPPED = 1
RUNNING = 2
WAITING = 3
ERROR   = 4
class TaskMaster:
    starts_complete = False
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
            "type":"mode",
            "restart":True,
            "state":STOPPED,
        })

    def register_start(self, name, runner):
        self.STARTS.append({
            "name":name,
            "runner":runner,
            "gen":0,
            "start":time.monotonic(),
            "delay":0,
            "restart":False,
            "type":"start",
            "state":STOPPED,
        })

    def register_loop(self, name, runner):
        self.LOOPS.append({
            "name":name,
            "runner":runner,
            "gen":0,
            "start":time.monotonic(),
            "delay":0,
            "type":"loop",
            "restart":True,
            "state":STOPPED,
        })

    def register_event(self, name, runner):
        self.EVENTS.append({
            "name":name,
            "runner":runner,
            "gen":0,
            "start":time.monotonic(),
            "delay":0,
            "type":"event",
            "restart":True,
            "state":STOPPED,
        })

    def getCurrentMode(self):
        return self.MODES[self.current]

    def start(self):
        print("starting the taskmaster")
        self.current = 0
        # only run starts once
        for start in self.STARTS:
            start['gen'] = start['runner']()
            start['state'] = RUNNING
        # the rest use generators
        for loop in self.LOOPS:
            loop['gen'] = loop['runner']()
            loop['state'] = RUNNING
        # don't start modes. they are started on demand
#         for mode in self.MODES:
#             mode['gen'] = mode['runner']()
        for event in self.EVENTS:
            event['gen'] = event['runner']()
            event['state'] = RUNNING
        # start the current mode
        if len(self.MODES) > 0:
            self.startMode(self.getCurrentMode())

    def startMode(self, mode):
        print("starting", mode["name"])
        mode['gen'] = mode["runner"]()
        mode['state'] = RUNNING

    def stopMode(self, mode):
        print("stopping", mode["name"])
        mode['state'] = STOPPED
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
        if event['state'] == STOPPED:
            return
        now = time.monotonic()
        delay = event['delay']
        start = event['start']
        diff = now-start
        if diff > delay:
            try:
                event['delay'] = next(event['gen'])
            except StopIteration:
                if event['type'] == 'start':
                    print("stopping ", event['type'], event['name'])
                    self.starts_complete = True
                    event['state'] = STOPPED
                if event['restart']:
                     event['gen'] = event['runner']()
            except TypeError:
                if event['type'] == 'start':
                    print("stopping ", event['type'], event['name'])
                    self.starts_complete = True
                    event['state'] = STOPPED
                if event['restart']:
                     event['gen'] = event['runner']()
            event['start'] = now

    def cycleLoop(self,loop):
        next(loop['gen'])

    def cycle(self, rate):
        # run start handlers first
        for start in self.STARTS:
            self.cycleThing(start)
#         print(self.starts_complete)
        if self.starts_complete:
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


