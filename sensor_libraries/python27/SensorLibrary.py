import paho.mqtt.client as mqtt

import json
import datetime

# json.loads(payload) to convert from JSON -> Python

class Sensor:
    def __init__(self, clientId, authKey, dataType, serverIpOrDomain, serverPort):

        # TODO: Attach a listener to `flowPub/` publishes
        #       that takes a callback function to "bubble up"

        self.client = SensorMQTTClient(
            clientId, authKey, dataType, serverIpOrDomain, serverPort)

        self._clientId = clientId
        self._dataType = dataType

        self.client.init()

    ##########

    def logData(self, value, dataType=None):
        if dataType is None:
            dataType = self._dataType

        currentTime = datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'

        payload = {
            "value": value,
            "dataType": dataType,
            "timestamp": currentTime,
            "sensorId": self._clientId
        }
        self.client.publish("log", json.dumps(payload))

########################################

class SensorMQTTClient(mqtt.Client):
    def __init__(self, clientId, authKey, dataType, serverIpOrDomain, serverPort):
        self._clientId = clientId
        self._authKey = authKey
        self._dataType = dataType
        self._serverIp = serverIpOrDomain
        self._serverPort = serverPort

        mqtt.Client.__init__(self, clientId)

    ##########

    def on_connect(self, mqttc, obj, flags, rc):
        if rc == 0:
            self.subscribe("flowPub/" + self._clientId)
        else:
            print("rc: " + str(rc))
            
    ##########

    def on_message(self, mqttc, obj, msg):
        print(msg.topic + " " + str(msg.qos) + " " + str(msg.payload))
    
    ##########

    # def on_publish(self, mqttc, obj, mid):
    #     print("mid: " + str(mid))
        
    ##########

    # def on_subscribe(self, mqttc, obj, mid, granted_qos):
    #     print("Subscribed: " + str(mid) + " " + str(granted_qos))
        
    ##########

    # def on_log(self, mqttc, obj, level, string):
    #     print(string)

    ##########

    def init(self):
        self.username_pw_set(username=self._clientId, password=self._authKey)
        self.connect_async(self._serverIp, self._serverPort)

        rc = 0
        self.loop_start()

        return rc

########################################