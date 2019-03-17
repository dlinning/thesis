import socket
import sys
import json
import datetime
import os

SERVER_ADDRESS = 'localhost'
SERVER_PORT = 3000
AUTH_KEY = '1234AUTHKEY4321'

# Connect to a UDP socket
sock = None
server_obj = None

# Attempt to load a saved UUID from disk
sensorId = None
if(os.path.isfile('./uuid.dat')):
    f = open('./uuid.dat', 'r')
    sensorId = f.read()

# Creates a socket, runs `connect()`.ff
def create(name, dataType, addr, port):
    SERVER_ADDRESS = addr
    SERVER_PORT = port

    global sock
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

    global server_obj
    server_obj = (SERVER_ADDRESS, SERVER_PORT)

    connect(name, dataType)

# Will attempt to connect to the socket
# with info from `create`.
def connect(n, dt):
    if (sock != None and server_obj != None):
        global sensorId

        payload = '{"type":"connect","name": "%s","dataType": "%s","id":"%s","authKey":"%s"}' % (
            n, dt, sensorId, AUTH_KEY)
        resp = sendMessage(payload)
        if (resp['status'] == 200):
            sensorId = resp['uuid']
            # Save to disk for consistency
            f = open('./uuid.dat', 'w+')
            f.write(resp['uuid'])

# Will log `value` to the previously setup socket.
def log(value):
    if (sensorId != None):
        ts = datetime.datetime.now().strftime('%Y-%m-%dT%H:%M:%SZ')
        payload = '{"type": "log", "value": "%s", "sensorUUID":"%s", "timestamp":"%s", "authKey":"%s"}' % (
            str(value), sensorId, ts, AUTH_KEY)
        sendMessage(payload)
    else:
        print("Unable to log %s as CONNECT failed." % (value))


# Will send `payload` and return the response from the server.
def sendMessage(payload):
    sentConf = sock.sendto(payload, server_obj)
    data, server = sock.recvfrom(4096)
    return json.loads(data)