class SensorTile extends React.Component {
    constructor(p) {
        super(p);

        this.state = {};
    }

    render() {
        let s = this.props.sensor;
        let sid = s.id.substr(0, 7);
        return (
            <Tile rowSpan={this.props.rowSpan} colSpan={this.props.colSpan}>
                <h2>{s.friendlyName}</h2>
                <div className="flex-row sb">
                    <b>ID:</b> <span>{sid}</span>
                </div>
                <div className="flex-row sb">
                    <b>Data Type:</b> <span>{s.dataType}</span>
                </div>
                {s.Groups.length > 0 && (
                    <div>
                        <hr />
                        <span>
                            <b>Groups: </b>
                        </span>
                        {s.Groups.map(g => {
                            let gid = g.id.substr(0, 7);
                            return (
                                <div key={g.id} className="flex-col">
                                    <div className="flex-row sb">
                                        <b>Name:</b> <span>{g.name}</span>
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
        fetch("/api/sensors/logs/" + this.props.sensor.id)
            .then(res => {
                return res.json();
            })
            .then(asJson => {
                messenger.notify("OpenModal", {
                    title: `Logs For Sensor: ${this.props.sensor.id.substr(0, 7)}`,
                    content: <LogList entries={asJson} />
                });
            })
            .catch(err => {
                console.error(err);
            });
    }
}
