class Dashboard extends React.Component {
    constructor(p) {
        super(p);

        this.state = {};
    }

    render() {
        var s = this.state;
        return (
            <>
                <h1>Dashboard</h1>
                <span>
                    {s.sensors &&
                        s.sensors.list.map(sensor => {
                            return <Tile sensor={sensor} />;
                        })}
                </span>
            </>
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
