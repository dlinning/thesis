class SensorList extends React.Component {
    openSensorSettingsModal(sensorId) {
        fetch("/api/sensors/settings/" + sensorId)
            .then(res => {
                return res.json();
            })
            .then(asJson => {
                asJson.sensorId = sensorId;
                messenger.notify("OpenModal", {
                    title: `Settings for Sensor ${sensorId.substr(0, 7)}`,
                    content: <SensorEditModal data={asJson} />
                });
            })
            .catch(err => {
                console.error(err);
            });
    }

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
                                        ({sensor.meta.id.substr(0, 7)})
                                    </div>
                                    <div className="sl-dt">{sensor.meta.dataType}</div>
                                </div>
                            </div>
                            <div className="sl-gc">Groups: {sensor.groups && sensor.groups.length}</div>
                            <div className="sl-controls flex-row fe">
                                <button className="small overlay" onClick={() => this.openSensorSettingsModal(sensor.meta.id)}>
                                    <i className="fas fa-cog" />
                                    <span>Manage</span>
                                </button>
                                <button className="small overlay danger">
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
