import SensorLib

import random
import time

SensorLib.create("Float Sensor", "float", 'localhost', 3000)

def randomColor():
    r = lambda: random.randint(0, 255)
    g = lambda: random.randint(0, 255)
    b = lambda: random.randint(0, 255)
    hexString = '#%02X%02X%02X' % (r(),r(),r())
    return hexString

n = 0
while 1:
    #SensorLib.log(randomColor())
    SensorLib.log(round(random.uniform(1.0, 20),5))
    #n = n + 1
    time.sleep(random.randint(1, 5))

