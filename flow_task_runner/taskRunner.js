const config = require("./config.json");
const debug = process.env.NODE_ENV != "production";

const DBHelper = require("../common/helpers/new_dbhelper");

var taskRunner = null;

// Used internally to start the TaskRunner,
// and also able to be triggered externally via module.exports.
const startTaskRunner = () => {
	let setting = DBHelper.getSpecificSetting("flowInterval");

	if (setting.status === 200) {
		taskRunner = setInterval(runTasks, Number(setting.value));
	} else {
		console.error(
			"Unable to start task runner. Check DB for `flowInterval` setting."
		);
	}
};
module.exports.startTaskRunner = startTaskRunner;

// Used internally to stop the TaskRunner,
// and also able to be triggered externally via module.exports.
const stopTaskRunner = () => {
	clearInterval(taskRunner);
};
module.exports.stopTaskRunner = stopTaskRunner;

// Clear the currently running TaskRunner,
// pull the most recent "interval" timing from DB,
// restart with new interval
const restartTaskRunner = () => {
	stopTaskRunner();
	startTaskRunner();
};
module.exports.restartTaskRunner = restartTaskRunner;

// Not exported since this should only be
// called directly from `startTaskRunner()` or `stopTaskRunner()`
const runTasks = () => {
	console.log("Running Tasks");
};
