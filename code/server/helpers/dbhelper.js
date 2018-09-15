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
    }

    // A wrapper around `sequelize.define`
    // See http://docs.sequelizejs.com/manual/tutorial/models-definition.html
    //
    addDbDefinition(name, properties) {
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

    // Store a sensor in the DB. Should take place after inital connect
    //
    // The only necessary field for `config` is `dataType`.
    // `id` is auto-generated.
    // `friendlyName` will be "AUTO_" + `name` if empty.
    //
    addSensor(name, config) {
        if (this.dbObjects["Sensor"] === undefined) {
            this.addDbDefinition("Sensor", {
                id: {
                    type: Sequelize.UUID,
                    primaryKey: true,
                    defaultValue: Sequelize.UUIDV4
                },
                friendlyName: Sequelize.STRING,
                dataType: Sequelize.STRING
            });
        }

        if (config.friendlyName === undefined) {
            config.friendlyName = "AUTO_" + name;
        }
        this.sequlize
            .sync()
            .then(() => this.dbObjects["Sensor"].create(config))
            .then(newSensor => {
                console.log(`New Sensor's UUID is ${newSensor.id}`);
            });
    }
};
