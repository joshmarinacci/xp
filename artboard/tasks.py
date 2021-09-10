import time

class TaskMaster:
    def __init__(self):
        self.MODES = []
    def register(self, name,gen):
        self.MODES.append({
            "name":name,
            "gen":gen,
            "start":time.monotonic(),
            "delay":0,
        })

    def cycle(self, rate):
        now = time.monotonic()
        for mode in self.MODES:
            delay = mode['delay']
            start = mode['start']
            diff = now-start
            if diff > delay:
                mode['delay'] = next(mode['gen'])
                mode['start'] = now
        time.sleep(rate)


#tm = TaskMaster()
