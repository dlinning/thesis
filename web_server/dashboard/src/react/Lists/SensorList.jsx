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
    }

    componentDidMount() {
        this.updateSensorList();
        this.getGroupList();
    }

    updateSensorList() {
        jsonFetch("/api/sensors/list")
            .then(res => {
                this.setState({ sensors: res, error: null });
            })
            .catch(err => {
                this.setState({ error: err });
                console.error(err);
            });
    }

    getGroupList() {
        jsonFetch("/api/groups/list")
            .then(res => {
                this.setState({ allGroups: res });
            })
            .catch(err => {
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
        jsonFetch("/api/sensors/settings/" + sensorId)
            .then(resp => {
                resp.sensorId = sensorId;
                messenger.notify("OpenModal", {
                    title: `Settings for Sensor ${sensorId.substr(0, 7)}`,
                    content: <SensorEditModal data={resp} allGroups={this.state.allGroups} />
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
                    title: `Logs For Sensor: ${sensorId.substr(0, 7)}...`,
                    content: <LogList entries={resp} />
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
                    this.props.sensorRemoveCallback();
                }
            })
            .catch(err => {
                console.error(err);
            });
    }

    openAddSensorModal() {
        //TODO: This
        alert("Message about how to add a sensor into the system");
    }

    //

    render() {
        let sensors = this.state.sensors;
        if (sensors === undefined) {
            return null;
        }

        return (
            <>
                <div className={this.props.standalone ? "flex-grid cols-3" : "flex-col"}>
                    {!this.props.standalone && (
                        <div className="flex-row aic sb title-row">
                            <h2>Sensors</h2>
                            <button className="round" onClick={this.openAddSensorModal.bind(this)}>
                                <i className="fas fa-plus" />
                            </button>
                        </div>
                    )}
                    {sensors.map(s => {
                        return (
                            <div className="tile" key={`sensor_${s.id}`}>
                                <div className="title">{s.name}</div>
                                <div className="desc">
                                    <span title={s.id}>({s.id.substr(0, 6)})</span>
                                    <span>{s.dataType}</span>
                                </div>
                                <div className="content">
                                    <div className="data-module clickable" title="View logs" onClick={() => this.openSensorLogModal(s.id)}>
                                        <span className="value">{s.logCount > 999000 ? "999k+" : Number(s.logCount).toLocaleString()}</span>
                                        <span className="label">Log Count</span>
                                    </div>
                                    <div className="data-module">
                                        <span className="value">{s.groups.length}</span>
                                        <span className="label">In Groups</span>
                                    </div>
                                    <div className="data-module">
                                        <button onClick={() => this.openSensorSettingsModal(s.id)}>Manage</button>
                                        <button className="warn overlay">Remove</button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {sensors.length === 0 && (
                        <div className="tile">
                            <div className="title">No Sensors Added</div>
                            <br />
                            <div className="content">
                                <p>To begin using IoT Board, please add one or more sensors to the system first.</p>
                            </div>
                        </div>
                    )}
                </div>
            </>
        );
    }
}
