import SensorLib

import random
import time

SensorLib.create("Python Sensor 3", "int", 'localhost', 3000)

n = 0
while 1:
    SensorLib.log(random.randint(25, 50))
    n = n + 1
    time.sleep(random.randint(1, 5))