from SensorLibrary import Sensor

import time

s1 = Sensor("Python_Client", "AUTH_KEY", "float", "localhost", 1883)

print("PRE_LOGGING")
s1.logData("a value")

while True:
    time.sleep(5)  # Sleep for 5 second
    print("LOGGING")
    s1.logData("a value")
