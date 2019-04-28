class SensorList extends React.Component {
    constructor(p) {
        super(p);

        this.state = {};

        // Handles updating the "background" list
        // when using SensorEditModal component.
        messenger.subscribe("SensorUpdated", obj => {
            this.updateLocalSensor(obj.id, obj.updatedSensor);
        });
        messenger.subscribe("SensorGroupsUpdated", obj => {
            this.updateLocalSensor(obj.id, obj.groups, "groups");
        });

        this.interval = null;
    }

    componentDidMount() {
        this.updateSensorList();

        // Set to pull new log counts every 30 seconds
        this.interval = setInterval(() => {
            this.updateLogCounts();
        }, 30000);
    }
    componentWillUnmount() {
        clearInterval(this.interval);
    }

    updateSensorList() {
        jsonFetch("/api/sensors/list")
            .then(res => {
                this.setState({ sensors: res, error: null });
            })
            .catch(err => {
                messenger.notify("OpenToast", { msg: `Unable to fetch Sensors`, warn: true });
                console.error(err);
            });
    }

    updateLogCounts() {
        jsonFetch("/api/sensors/logCounts")
            .then(res => {
                // Cause it's easy to work with like this
                let easy = {};
                if (res.length > 0) {
                    for (let i = 0, len = res.length; i < len; i++) {
                        easy[res[i].SensorId] = res[i].count;
                    }
                }

                let sensors = this.state.sensors;
                for (var n = 0, l = sensors.length; n < l; n++) {
                    let newCount = easy[sensors[n].id];
                    if (newCount) {
                        sensors[n].logCount = newCount;
                    }
                }

                this.setState((nextState, nextProps) => {
                    return {
                        sensors: nextState.sensors
                    };
                });
            })
            .catch(err => {
                messenger.notify("OpenToast", { msg: `Unable to update sensor log counts`, warn: true });
                console.error(err);
            });
    }

    updateLocalSensor(sensorId, newVal, key) {
        let sensors = this.state.sensors;
        if (sensors) {
            for (var n = 0, l = sensors.length; n < l; n++) {
                if (sensors[n].id === sensorId) {
                    if (key !== undefined) {
                        sensors[n][key] = newVal;
                    } else {
                        // Update "everything", but keep groups/logCount
                        sensors[n].name = newVal.name;
                        sensors[n].dataType = newVal.dataType;
                        sensors[n].updatedAt = newVal.updatedAt;
                    }

                    this.setState({ sensors: sensors, error: null });
                    break;
                }
            }
        }
    }

    openSensorSettingsModal(sensorId) {
        Promise.all([jsonFetch("/api/sensors/settings/" + sensorId), jsonFetch("/api/groups/list")])
            .then(values => {
                // values[0] is the sensor data,
                // values[1] is all groups
                values[0].sensorId = sensorId;
                messenger.notify("OpenModal", {
                    title: `Settings for Sensor ${sensorId.substr(0, 7)}`,
                    content: <SensorEditModal data={values[0]} allGroups={values[1]} />
                });
            })
            .catch(err => {
                console.error(err);
            });
    }

    openSensorLogModal(sensorId) {
        jsonFetch("/api/sensors/logs/" + sensorId)
            .then(resp => {
                messenger.notify("OpenModal", {
                    title: `Logs For Sensor: ${sensorId}...`,
                    content: <LogList entries={resp} exportTitle={`SensorLogs_${sensorId}`} hideSensorColumn={true} />
                });
            })
            .catch(err => {
                console.error(err);
            });
    }

    removeSensor(sensorId, deleteWithLogs = "") {
        jsonFetch(`/api/sensors/delete/${sensorId}/${deleteWithLogs}`, null, "DELETE")
            .then(resp => {
                if (resp.sensor && resp.sensor.hasLogs) {
                    // Verify the user wants to remove a sensor that has logged data
                    var r = confirm(
                        `Are you sure you want to delete sensor with ID:\n${sensorId}\nas it has logged data?\nNOTE: This will also delete the logged data.`
                    );
                    if (r == true) {
                        // Force the remove
                        this.removeSensor(sensorId, true);
                    }
                } else {
                    // Sensor was removed, either by previous prompt
                    // or it never had logs in the first place
                    this.updateSensorList();
                }
            })
            .catch(err => {
                console.error(err);
            });
    }

    openAddSensorModal() {
        //TODO: This

        jsonFetch("/api/settings/get/group/mqtt")
            .then(res => {
                const domain = res.domainName;

                messenger.notify("OpenModal", {
                    title: `Add a New Sensor`,
                    content: (
                        <div className="addSensorModal">
                            <p>Point the Sensor towards:</p>
                            <p className="center">
                                <code>{domain}</code>
                            </p>
                            <p>
                                Manually configure the MQTT "clientId" value as a unique identifier in order to recognize the Sensor within
                                the system.
                            </p>
                            <p>
                                Set the Sensor's MQTT "password" to the password value defined in the <code>BrokerConfig.json</code> file on
                                the server.
                            </p>
                            <p>
                                New Sensors will appear in the system as soon as they are connected, and can be added to Groups or used in
                                Flows after the initial connection.
                            </p>
                        </div>
                    )
                });
            })
            .catch(err => {
                messenger.notify("OpenToast", { msg: `Unable to fetch MQTT Settings data.`, warn: true });
                console.error(err);
            });
    }

    goToSensorsPage() {
        messenger.notify("ChangePage", "sensors");
    }

    //

    render() {
        let sensors = this.state.sensors;
        if (sensors === undefined) {
            return null;
        }

        return (
            <>
                {this.props.standalone && (
                    <button className="page-add-btn" onClick={this.openAddSensorModal.bind(this)}>
                        Add Sensor
                    </button>
                )}
                <div className={this.props.standalone ? "flex-grid" : "flex-col list-homepage"}>
                    {!this.props.standalone && (
                        <div className="flex-row aic sb title-row">
                            <h2>Sensors</h2>
                            <button className="round" onClick={this.openAddSensorModal.bind(this)}>
                                <span>&#43;</span>
                            </button>
                        </div>
                    )}
                    {sensors.map((s, idx) => {
                        if (this.props.standalone || idx < 10) {
                            return (
                                <div className="tile" key={s.id}>
                                    <div className="title">{s.name}</div>
                                    {this.props.standalone && (
                                        <div className="desc">
                                            <span title={s.id}>{s.id.substr(0, 25)}</span>
                                        </div>
                                    )}
                                    <div className="content">
                                        <div
                                            className="data-module clickable"
                                            title="View logs"
                                            onClick={() => this.openSensorLogModal(s.id)}
                                        >
                                            <span className="value">
                                                {s.logCount > 999000 ? "999k+" : Number(s.logCount).toLocaleString()}
                                            </span>
                                            <span className="label">Log Count</span>
                                        </div>
                                        <div className="data-module">
                                            <span className="value">{s.groups.length}</span>
                                            <span className="label">In Groups</span>
                                        </div>
                                        <div className="data-module">
                                            <button className="small" onClick={() => this.openSensorSettingsModal(s.id)}>
                                                Manage
                                            </button>
                                            {this.props.standalone && (
                                                <button className="warn overlay small" onClick={() => this.removeSensor(s.id)}>
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        } else {
                            return null;
                        }
                    })}
                    {!this.props.standalone && sensors && sensors.length > 10 && (
                        <button onClick={this.goToSensorsPage}>View All Sensors</button>
                    )}
                    {sensors.length === 0 && (
                        <div className="tile">
                            <div className="title">No Sensors Added</div>
                            <br />
                            <div className="content">
                                <p>To begin using Simple IoT, please add one or more sensors to the system first.</p>
                            </div>
                        </div>
                    )}
                </div>
            </>
        );
    }
}
