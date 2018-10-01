//
//If using a DB engine besides SQLite, you will
//have to change this file accordingly.
//
const debug = process.env.NODE_ENV != 'production';
console.log('in debug', debug);

const sqlite3 = require("sqlite3");
if (debug == true) {
	sqlite3.verbose();
}

const Sequelize = require("sequelize");

//
//TODO: Refactor to Singleton,
//as multiple instances shouldn't be touching DB.
//

module.exports = class DBHelper {
	constructor(config) {
		console.log('!!!!!!INIT DBHELPER!!!!!!');
		this.config = config;

		// Create the DB defined in `config`
		this.db_path = this.config.sequelizeOpts.storage;
		this._CreateDB();

		// Connect to the previously checked/created DB
		// Adapted from "Example Usage" on http://docs.sequelizejs.com/
		this.sequlize = new Sequelize(
			config.name,
			config.username,
			config.password,
			config.sequelizeOpts
		);

		// Setup an object of `dbObjects` so that we can
		// not have a bunch of random objects coming off
		// of `this`.
		this.dbObjects = {};

		// Setup the necessary DB Objects
		this._addDbDefinition("Sensor", {
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
		this._addDbDefinition("Group", {
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
		this.dbObjects["Sensor"].belongsToMany(this.dbObjects["Group"], {
			through: "SensorGroup"
		});
		this.dbObjects["Group"].belongsToMany(this.dbObjects["Sensor"], {
			through: "SensorGroup"
		});

		this._addDbDefinition("LogEntry", {
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

		// Finally, sync the model definitions after adding
		// them all.
		this.sequlize.sync();
	}

	// A wrapper around `sequelize.define`
	// See http://docs.sequelizejs.com/manual/tutorial/models-definition.html
	//
	_addDbDefinition(name, properties) {
		if (this.dbObjects[name] === undefined) {
			this.dbObjects[name] = this.sequlize.define(name, properties);
		} else {
			console.error(`Error: Database definition already exits for ${name}.`);
			process.exit(1);
		}
	}

	// A wrapper around `sequelize.hasMany`
	//
	_addHasMany(one, many, name) {
		this.dbObjects[one].hasMany(this.dbObjects[many], { as: name });
	}

	// Sets up the database, creating it if it does not exist.
	// Will return `true` if the database if found/created, or `false` if not.
	//
	_CreateDB() {
		let db = new sqlite3.Database(this.db_path);
		var good = false;

		db.serialize(() => {
			good = true;
			console.log(`${this.db_path} found/initialized.`);
		});
		db.close();

		return good;
	}

	/////
	/////
	/////

	// `toCheck` is an array of {type:STRING,id:PRIMARYKEY}
	// that will return true or false if either all exist
	// or not all exist, respectively. All entries MUST
	// be unique.
	//
	checkExists(toCheck) {
		var promises = toCheck.map(check => {
			return this.dbObjects[check.type].count({ where: { id: check.id } });
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

	// Store a sensor in the DB. Should take place after inital connect.
	// Will return the new Sensor's UUID that was just created.
	//
	// If given a `uuid`, this will instead lookup that Sensor,
	// and still return the UUID if it exists.
	//
	registerSensor(name, dataType, uuid) {
		//TODO: Rethink this, possibly Upsert?
		if (uuid != undefined) {
			return this.dbObjects["Sensor"]
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
			return this.dbObjects["Sensor"]
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

	// Creates/Updates a group with the given name.
	// Only creates it, and returns a success or failure.
	// Will update the name if given `uuid`.
	//
	createOrUpdateGroup(name, uuid) {
		if (uuid.length == 0) {
			uuid = undefined;
		}
		return this.dbObjects["Group"]
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


	// Will return a paginated list of all
	// dbObjects[type] that are created, along
	// with extra data for pagination.
	//
	// If `include` is defined, then that will be passed
	// down to the `findAndCountAll()`.
	//
	listByType(type, _page = 0, _limit = 10, include) {
		var startIndex = _page * _limit;
		return this.dbObjects[type]
			.findAndCountAll({
				offset: startIndex,
				limit: _limit,
				include : include
			})
			.then(result => {
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

	// Sets the groupID for a sensor with id = sensorID.
	// Puts that sensor in the group.
	//
	addSensorToGroup(sensorID, groupID) {
		return this.dbObjects["Sensor"]
			.findOne({ where: { id: sensorID } })
			.then(sensor => {
				return this.dbObjects["Group"]
					.findOne({ where: { id: groupID } })
					.then(group => {
						return group.addSensor(sensor);
					}).catch(groupErr => {
						console.log(groupErr);
						return groupErr;
					});
			}).catch(sensorErr => {
				console.log(sensorErr);
				return sensorErr;
			});
	}

	// Store a log entry for a given sensor.
	// Does not return anything.
	//
	logData(value, sensorUUID, timestamp) {
		this.dbObjects["LogEntry"]
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
};
