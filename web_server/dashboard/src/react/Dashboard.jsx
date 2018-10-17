class Dashboard extends React.Component {
    constructor(p) {
        super(p);

        this.state = {};
    }

    render() {
        var s = this.state;
        return (
            <div className="dashboard">
                {s.sensors &&
                    s.sensors.list.map((sensor, idx) => {
                        return <SensorTile key={idx} sensor={sensor} />;
                    })}
            </div>
        );
    }

    componentDidMount() {
        fetch("/api/sensors/list")
            .then(res => {
                return res.json();
            })
            .then(asJson => {
                this.setState({ sensors: asJson });
            })
            .catch(err => {
                console.error(err);
            });
    }
}
