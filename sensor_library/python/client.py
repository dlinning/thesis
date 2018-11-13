import SensorLib

import random
import time

SensorLib.create("Python Sensor 2", "int", 'localhost', 3000)

n = 0
while n < 10:
    SensorLib.log(random.randint(25, 50))
    n = n + 1
    time.sleep(1)