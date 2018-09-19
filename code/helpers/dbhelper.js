//
//If using a DB engine besides SQLite, you will
//have to change this file accordingly.
//

const sqlite3 = require("sqlite3").verbose();

const Sequelize = require("sequelize");

module.exports = class DBHelper {
	constructor(config) {
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

		this._addHasMany("Group", "Sensor", "Sensors");

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

	// Store a sensor in the DB. Should take place after inital connect.
	// Will return the new Sensor's UUID that was just created.
	//
	// If given a `uuid`, this will instead lookup that Sensor,
	// and still return the UUID if it exists.
	//
	registerSensor(name, dataType, uuid) {
		//TODO: Rethink this, possibly Upsert?
		if (uuid != undefined) {
			return this.sequlize
				.then(() => this.dbObjects["Sensor"].findById(uuid))
				.then(res => {
					console.log(`Found Sensor's UUID is ${res.id}`);
					return res.id;
				})
				.catch(err => {
					console.error(err);
					return null;
				});
		} else {
			return this.sequlize
				.then(() =>
					this.dbObjects["Sensor"].create({
						friendlyName: name,
						dataType: dataType
					})
				)
				.then(res => {
					console.log(`New Sensor's UUID is ${res.id}`);
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
		return this.sequlize
			.then(() =>
				this.dbObjects["Group"].upsert({
					id: uuid,
					name: name
				})
			)
			.then(res => {
				return `Group created/updated with name ${name}`;
			})
			.catch(err => {
				console.error(err);
				return null;
			});
	}

	// Will return a paginated list of all
	// groups that are created, along
	// will a count of the total groups.
	// (This can be used to pull the ones
	// not on the first page if necessary.)
	//
	listGroups(_page = 0, _limit = 10) {
		var startIndex = _page * _limit;
		return this.dbObjects["Group"]
			.findAndCountAll({
				offset: startIndex,
				limit: _limit
			})
			.then(result => {
				let count = result.count;
				let rows = result.rows;

				return {
					total: count,
					startIndex: startIndex,
					limit: _limit,
					groups: rows
				};
			});
	}

	// Store a log entry for a given sensor.
	// Does not return anything.
	//
	logData(value, sensorUUID, timestamp) {
		this.sequlize
			.then(() =>
				this.dbObjects["LogEntry"].create({
					value: value.toString(),
					timestamp: timestamp,
					sensorUUID: sensorUUID
				})
			)
			.then(newSensor => {
				console.log(`Logged ${value} for sensor ${sensorUUID} @ ${timestamp}`);
			})
			.catch(err => {
				console.error(err);
			});
	}
};
