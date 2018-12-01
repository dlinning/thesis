class SensorTile extends React.Component {
    constructor(p) {
        super(p);

        this.state = {};
    }

    render() {
        let s = this.props.sensor;
        let sid = this.props.sensor.meta.id.substr(0, 7);
        return (
            <Tile rowSpan={this.props.rowSpan} colSpan={this.props.colSpan}>
                <h2>{s.name}</h2>
                <div className="flex-row sb">
                    <b>ID:</b> <span>{sid}</span>
                </div>
                <div className="flex-row sb">
                    <b>Data Type:</b> <span>{s.meta.dataType}</span>
                </div>
                {s.groups.length > 0 && (
                    <div>
                        <hr />
                        <span>
                            <b>Groups: </b>
                        </span>
                        {s.groups.map((g, idx) => {
                            let gid = g.GroupId.substr(0, 7);
                            return (
                                <div key={idx} className="flex-col">
                                    <div className="flex-row sb">
                                        <b>Name:</b> <span>{g.Groupname}</span>
                                    </div>
                                    <div className="flex-row sb">
                                        <b>ID:</b> <span>{gid}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
                <button onClick={() => this.loadLogEntries()}>Display Logs</button>
            </Tile>
        );
    }

    loadLogEntries() {
        jsonFetch("/api/sensors/logs/" + this.props.sensor.meta.id)
            .then(resp => {
                messenger.notify("OpenModal", {
                    title: `Logs For Sensor: ${this.props.sensor.meta.id.substr(0, 7)}...`,
                    content: <LogList entries={resp} />
                });
            })
            .catch(err => {
                console.error(err);
            });
    }
}
