tm.start()

start_time = time.monotonic()
running = True
while running:
    tm.cycle(0.01)
    now = time.monotonic()
    if now > start_time + 20:
        running = False
