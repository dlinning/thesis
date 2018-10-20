class SensorList extends React.Component {
    render() {
        let sensors = this.props.sensors;
        if (sensors === undefined || sensors.list.length === 0) {
            return null;
        }

        return (
            <>
                {sensors.list.length > 0 && (
                    <div className="list">
                        {sensors.list.map((sensor, idx) => {
                            return (
                                <div className="item" key={idx}>
                                    <div className="flex-col sl-nid">
                                        <div className="sl-n">{sensor.friendlyName}</div>
                                        <div className="sl-details flex-row">
                                            <div className="sl-id" title={sensor.id}>
                                                ({sensor.id.substr(0, 7)})
                                            </div>
                                            <div className="sl-dt">{sensor.dataType}</div>
                                        </div>
                                    </div>
                                    <div className="sl-gc">Groups: {sensor.Groups && sensor.Groups.length}</div>
                                    <div className="sl-controls flex-row fe">
                                        <button className="small overlay">
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
                    </div>
                )}
                {sensors.list.length === 0 && <p>You have no sensors currently registered. Please do so before viewing this page.</p>}
            </>
        );
    }
}
