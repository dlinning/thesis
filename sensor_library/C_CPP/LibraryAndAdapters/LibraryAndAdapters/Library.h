#pragma once

#include <stdint.h>
#include <time.h>

struct SensorSendDatagram {
	char* sensorName;
	char* value;
	char* valueType;
	time_t timestamp;
};

//// current date/time based on current system
//time_t now = time(0);
//
//// convert now to string form
//string dt = ctime(&now);