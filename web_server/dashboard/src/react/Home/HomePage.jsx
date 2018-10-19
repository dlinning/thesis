class HomePage extends React.Component {
    constructor(p) {
        super(p);

        this.state = {};
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

    render() {
        var s = this.state;
        return (
            <>
                <h1>Home</h1>
                <DashboardTiles>
                    {s.sensors &&
                        s.sensors.list.map((sensor, idx) => {
                            return <SensorTile rowSpan={idx + 2} colSpan={idx + 1} key={idx} sensor={sensor} />;
                        })}
                </DashboardTiles>
            </>
        );
    }
}
