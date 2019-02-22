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
                        this.setState({ sensors: sensors, error: null });
                        break;
                    }
                }
            }
        });
        messenger.subscribe("SensorGroupsUpdated", obj => {
            let sensors = this.state.sensors;
            if (sensors) {
                for (var id in sensors) {
                    if (id === obj.id) {
                        sensors[id].groups = obj.groups;
                        this.setState({ sensors: sensors, error: null });
                        break;
                    }
                }
            }
        });
    }

    componentDidMount() {
        this.updateSensors();
    }

    updateSensors() {
        Promise.all([jsonFetch("/api/sensors/list"), jsonFetch("/api/groups/list")])
            .then(res => {
                this.setState({ sensors: res[0], allGroups: res[1], error: null });
            })
            .catch(err => {
                this.setState({ error: err });
                console.error(err);
            });
    }

    render() {
        var s = this.state;
        return (
            <>
                <h1>Manage Sensors</h1>
                <SensorList sensors={s.sensors} allGroups={s.allGroups} sensorRemoveCallback={this.updateSensors.bind(this)} />
                <ErrorCard error={s.error} />
            </>
        );
    }
}
// 
