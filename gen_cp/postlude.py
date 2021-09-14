tm.start()

start_time = time.monotonic()
_SYSTEM_running = True
while _SYSTEM_running:
    tm.cycle(0.01)
    now = time.monotonic()
    if now > start_time + 20:
        _SYSTEM_running = False


print("end everything")
