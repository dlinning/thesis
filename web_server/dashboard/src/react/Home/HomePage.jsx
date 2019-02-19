class HomePage extends React.Component {
    constructor(p) {
        super(p);

        this.state = {};
    }

    componentDidMount() {
        Promise.all([jsonFetch("/api/sensors/list"), jsonFetch("/api/groups/list"), jsonFetch("/api/flows/list")])
            .then(res => {
                this.setState({ sensors: res[0], allGroups: res[1], flows: res[2], error: null });
            })
            .catch(err => {
                this.setState({ error: err });
                console.error(err);
            });
    }

    render() {
        return (
            <>
                <h1>Home</h1>
                <div id="home-lists">
                    <HomePageSensorsList sensors={this.state.sensors} />
                    <HomePageGroupsList groups={this.state.allGroups} />
                    <HomePageFlowsList flows={this.state.flows} />
                </div>
            </>
        );
    }
}

class HomePageSensorsList extends React.PureComponent {
    render() {
        return (
            <div className="flex-col">
                <h2>Sensors</h2>
                {this.props.sensors &&
                    this.props.sensors.map(s => {
                        return (
                            <div className="tile" key={`sensor_${s.id}`}>
                                <div className="title">{s.name}</div>
                                <div className="desc">
                                    <span title={s.id}>({s.id.substr(0, 6)})</span>
                                    <span>{s.dataType}</span>
                                </div>
                                <div className="content">
                                    <div className="data-module">
                                        <span className="value">{s.logCount > 999000 ? "999k+" : Number(s.logCount).toLocaleString()}</span>
                                        <span className="label">Log Count</span>
                                    </div>
                                    <div className="data-module">
                                        <span className="value">{s.groups.length}</span>
                                        <span className="label">Groups</span>
                                    </div>
                                    <div className="data-module">
                                        <button>MANAGE</button>
                                        <button className="warn">Remove</button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
            </div>
        );
    }
}

class HomePageGroupsList extends React.PureComponent {
    render() {
        let p = this.props;
        return (
            <div className="flex-col">
                <h2>Groups</h2>
                {p.groups &&
                    p.groups.map(g => {
                        return (
                            <div className="tile" key={`group_${g.id}`}>
                                <div className="title">{g.name}</div>
                                <div className="desc">
                                    <span title={g.id}>({g.id.substr(0, 6)})</span>
                                </div>
                                <div className="content">
                                    <div className="data-module">
                                        <span className="value">{g.sensorCount}</span>
                                        <span className="label">Sensors</span>
                                    </div>
                                    <div className="data-module">
                                        <button>MANAGE</button>
                                        <button className="warn">Remove</button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
            </div>
        );
    }
}

class HomePageFlowsList extends React.PureComponent {
    render() {
        let p = this.props;
        return (
            <div className="flex-col">
                <h2>Flows</h2>
                {p.flows &&
                    p.flows.map(flow => {
                        return (
                            <div className="tile" key={`group_${flow.id}`}>
                                <div className="title">{flow.name}</div>
                                <div className="desc">
                                    <span title={flow.id}>({flow.id.substr(0, 6)})</span>
                                    {flow.description && <p>{flow.description}</p>}
                                </div>
                                <div className="content">
                                    <div className="data-module">
                                        <span className="value">{flow.activationCount}</span>
                                        <span className="label">Activation Count</span>
                                    </div>
                                    <div className="data-module">
                                        <button>MANAGE</button>
                                        <button className="warn">Remove</button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
            </div>
        );
    }
}