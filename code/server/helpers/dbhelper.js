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
        this.sequlize = new Sequelize(config.name, config.username, config.password, config.sequelizeOpts);

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
        if (uuid != undefined) {
            return this.sequlize
                .sync()
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
                .sync()
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

    // Store a log entry for a given sensor.
    // Does not return anything.
    //
    logData(value, sensorUUID, timestamp) {
        this.sequlize
            .sync()
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
