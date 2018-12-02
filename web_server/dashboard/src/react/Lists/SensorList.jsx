class SensorList extends React.Component {
    openSensorSettingsModal(sensorId) {
        jsonFetch("/api/sensors/settings/" + sensorId)
            .then(resp => {
                resp.sensorId = sensorId;
                messenger.notify("OpenModal", {
                    title: `Settings for Sensor ${sensorId.substr(0, 7)}`,
                    content: <SensorEditModal data={resp} allGroups={this.props.allGroups} />
                });
            })
            .catch(err => {
                console.error(err);
            });
    }

    openSensorLogModal(sensorId) {
        console.log(sensorId);
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
                    var r = confirm(`Are you sure you want to delete sensor with ID:\n${sensorId}\nas it has logged data?\nNOTE: This will also delete the logged data.`);
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

    //

    render() {
        let sensors = this.props.sensors;
        if (sensors === undefined) {
            return null;
        }
        const sensorLength = Object.keys(sensors).length;

        return (
            <div className="list">
                {Object.keys(sensors).map((id, idx) => {
                    let sensor = sensors[id];
                    return (
                        <div className="item" key={idx}>
                            <div className="flex-col sl-nid">
                                <div className="sl-n">{sensor.meta.name}</div>
                                <div className="sl-details flex-row">
                                    <div className="sl-id" title={sensor.meta.id}>
                                        ({sensor.meta.id.substr(0, 7)}...)
                                    </div>
                                    <div className="sl-dt">{sensor.meta.dataType}</div>
                                </div>
                            </div>
                            <div className="sl-logcount clickable" onClick={() => this.openSensorLogModal(sensor.meta.id)}>
                                <span className="label">Logs: </span>
                                <span>{sensor.logs ? sensor.logs.count : 0}</span>
                            </div>
                            <div className="sl-gc">
                                <span className="label">Groups: </span>
                                <span>{sensor.groups && sensor.groups.length}</span>
                            </div>
                            <div className="sl-controls flex-row fe">
                                <button className="small overlay" onClick={() => this.openSensorSettingsModal(sensor.meta.id)}>
                                    <i className="fas fa-cog" />
                                    <span>Manage</span>
                                </button>
                                <button className="small overlay danger" onClick={() => this.removeSensor(sensor.meta.id)}>
                                    <i className="fas fa-trash-alt" />
                                    <span>Remove</span>
                                </button>
                            </div>
                        </div>
                    );
                })}
                {sensorLength === 0 && <p>You have no sensors currently registered. Please do so before viewing this page.</p>}
            </div>
        );
    }
}
