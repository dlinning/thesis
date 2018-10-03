//
// If using a DB engine besides SQLite, you will
// have to change this file accordingly.
//
// Exports a singleton style object,
// so that there is only one process accessing
// the DB at a given point.
//
const debug = process.env.NODE_ENV != "production";
console.log("in debug", debug);

var fs = require('fs');
var path = require('path');

const sqlite3 = require("sqlite3");
if (debug == true) {
	sqlite3.verbose();
}
const Sequelize = require("sequelize");
const Op = Sequelize.Op;

/* 
	These are used like `this.____`, but since
	we're working in a singleton, they can be global
	to the file.
*/
var config = null;
var sequelizeInstance = null;
var dbObjects = {};

/* End */

function setupDatabase() {
	// Following 2 lines are for SQLite only.
	// Storing for easy reference elsewhere.
	//
	config.db_path = path.join(__dirname, "..", config.db.sequelizeOpts.storage);
	config.db.sequelizeOpts.storage = config.db_path;

	// Sets up the database, creating it if it does not exist.
	//
	let db = new sqlite3.Database(config.db_path);
	db.serialize(() => {
		console.log(`${config.db_path} found/initialized.`);
	});
	db.close();

	// Connect to the previously checked/created DB
	// Adapted from "Example Usage" on http://docs.sequelizejs.com/
	sequelizeInstance = new Sequelize(
		config.db_path,
		config.db.username,
		config.db.password,
		config.db.sequelizeOpts
	);

	// Now add all the Model Definitions
	// to the DB.
	//
	addDBDefinition("Sensor", {
		id: {
			type: Sequelize.UUID,
			primaryKey: true,
			defaultValue: Sequelize.UUIDV4
		},
		friendlyName: {
			type: Sequelize.STRING,
			allowNull: false
		},
		dataType: {
			type: Sequelize.STRING,
			allowNull: false
		}
	});

	// Will allow grouping of sensors,
	// can be looked up in dashboard.
	addDBDefinition("Group", {
		id: {
			type: Sequelize.UUID,
			primaryKey: true,
			defaultValue: Sequelize.UUIDV4
		},
		name: {
			type: Sequelize.STRING,
			allowNull: false
		}
	});

	// Setup relationship between Sensors and Groups
	dbObjects["Sensor"].belongsToMany(dbObjects["Group"], {
		through: "SensorGroup"
	});
	dbObjects["Group"].belongsToMany(dbObjects["Sensor"], {
		through: "SensorGroup"
	});

	addDBDefinition("LogEntry", {
		id: {
			type: Sequelize.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		sensorUUID: {
			type: Sequelize.UUID,
			allowNull: false
		},
		timestamp: {
			type: Sequelize.DATE,
			allowNull: false
		},
		//All data will be stored as a string,
		//which can be parsed accordingly
		//when reading the logs.
		value: {
			type: Sequelize.STRING,
			allowNull: false
		}
	});

	// Finally, sync the models to the DB.
	//
	sequelizeInstance.sync();
}

// A wrapper around `sequelize.define`
// See http://docs.sequelizejs.com/manual/tutorial/models-definition.html
//
function addDBDefinition(name, opts) {
	if (dbObjects[name] === undefined) {
		dbObjects[name] = sequelizeInstance.define(name, opts);
	} else {
		console.error(`Error: Database definition already exits for ${name}.`);
		process.exit(1);
	}
}

// A wrapper around `sequelize.hasMany`
//
function addHasMany(one, many, name) {
	dbObjects[one].hasMany(dbObjects[many], { as: name });
}

/* General DB Helper Functions */

// `toCheck` is an array of {type:STRING,id:PRIMARYKEY}
// that will return true or false if either all exist
// or not all exist, respectively. All entries MUST
// be unique.
//
function checkExists(toCheck) {
	var promises = toCheck.map(check => {
		return dbObjects[check.type].count({ where: { id: check.id } });
	});
	return Promise.all(promises)
		.then(values => {
			return values.reduce((a, b) => a + b) === values.length;
		})
		.catch(err => {
			console.error(err);
			return false;
		});
}

// Will return a paginated list of all
// dbObjects[type] that are created, along
// with extra data for pagination.
//
// If `include` is defined, then that will be passed
// down to the `findAndCountAll()`.
//
function listByType(type, _page = 0, _limit = 10, include = null) {
	var startIndex = _page * _limit;

	var query = {
		offset: startIndex,
		limit: _limit
	};

	if (include !== null) {
		query.include = include;
	}

	return dbObjects[type].findAndCountAll(query).then(result => {
		let count = result.count;
		let rows = result.rows;

		return {
			total: count,
			startIndex: startIndex,
			limit: _limit,
			list: rows
		};
	});
}

/* END General DB Helper Functions */

/* BEGIN Model-Specific DB Helper Functions */

// Store a sensor in the DB. Should take place after inital connect.
// Will return the new Sensor's UUID that was just created.
//
// If given a `uuid`, this will instead lookup that Sensor,
// and still return the UUID if it exists.
//
function registerSensor(name, dataType, uuid) {
	//TODO: Rethink this, possibly Upsert?
	if (uuid != undefined) {
		return dbObjects["Sensor"]
			.findById(uuid)
			.then(res => {
				if (res == null) {
					console.log(`Sensor not found in DB with id ${uuid}`);
					return null;
				}
				debug && console.log(`Found Sensor's UUID is ${res.id}`);
				return res.id;
			})
			.catch(err => {
				console.error(err);
				return null;
			});
	} else {
		return dbObjects["Sensor"]
			.create({
				friendlyName: name,
				dataType: dataType
			})
			.then(res => {
				debug && console.log(`New Sensor's UUID is ${res.id}`);
				return res.id;
			})
			.catch(err => {
				console.error(err);
				return null;
			});
	}
}

// Store a log entry for a given sensor.
// Does not return anything.
//
function logData(value, sensorUUID, timestamp) {
	dbObjects["LogEntry"]
		.create({
			value: value.toString(),
			timestamp: timestamp,
			sensorUUID: sensorUUID
		})
		.then(newSensor => {
			console.log(`Logged ${value} for sensor ${sensorUUID} @ ${timestamp}`);
		})
		.catch(err => {
			console.error(err);
		});
}

// Creates/Updates a group with the given name.
// Only creates it, and returns a success or failure.
// Will update the name if given `uuid`.
//
function createOrUpdateGroup(name, uuid) {
	if (uuid && uuid.length == 0) {
		uuid = undefined;
	}
	return dbObjects["Group"]
		.upsert({
			id: uuid,
			name: name
		})
		.then(res => {
			return `Group created/updated with name ${name}`;
		})
		.catch(err => {
			console.error(err);
			return null;
		});
}

// Sets the groupID for a sensor with id = sensorID.
// Puts that sensor in the group.
//
function addSensorToGroup(sensorID, groupID) {
	return dbObjects["Sensor"]
		.findOne({ where: { id: sensorID } })
		.then(sensor => {
			return dbObjects["Group"]
				.findOne({ where: { id: groupID } })
				.then(group => {
					return group.addSensor(sensor);
				})
				.catch(groupErr => {
					console.log(groupErr);
					return groupErr;
				});
		})
		.catch(sensorErr => {
			console.log(sensorErr);
			return sensorErr;
		});
}

/* END Model-Specific DB Helper Functions */

/* BEGIN Node.js Export */

module.exports = {
	init(_config) {
		if (config === null) {
			config = _config;
			setupDatabase();
		}
	},

	dbObjects: dbObjects,

	checkExists: checkExists,
	listByType: listByType,

	registerSensor: registerSensor,
	logData: logData,

	createOrUpdateGroup: createOrUpdateGroup,
	addSensorToGroup: addSensorToGroup
};

/* END Node.js Export */