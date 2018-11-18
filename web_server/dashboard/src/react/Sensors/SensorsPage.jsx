class SensorsPage extends React.Component {
    constructor(p) {
        super(p);

        this.state = {};

        // Handles updating the "background" list
        // when using SensorEditModal component.
        messenger.subscribe("SensorUpdated", obj => {
            let sensors = this.state.sensors;
            if (sensors) {
                for (var id in sensors) {
                    if (id === obj.id) {
                        sensors[id].meta = obj.new.meta;
                        this.setState({ sensors: sensors });
                        break;
                    }
                }
            }
        });
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
