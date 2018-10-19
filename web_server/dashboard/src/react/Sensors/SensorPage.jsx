class SensorPage extends React.Component {
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
                <h1>Manage Sensors</h1>
                <SensorList sensors={s.sensors} />
            </>
        );
    }
}
