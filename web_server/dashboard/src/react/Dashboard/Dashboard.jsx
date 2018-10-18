class Dashboard extends React.Component {
    constructor(p) {
        super(p);

        this.state = {
            page: "home"
        };

        this.setPage = this.setPage.bind(this);
        this.saveView = this.saveView.bind(this);
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

    setPage(pageName) {
        this.setState({ page: pageName });
    }

    saveView(data) {

        var viewData = {};
        fetch("api/dashboard/saveView", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(viewData)
        })
            .then(res => {
                return res.json();
            })
            .then(resJson => {
                console.log(resJson);
            })
            .catch(err => {
                console.error(err);
            });
    }

    render() {
        var s = this.state;
        return (
            <div className="dashboard">
                <DashboardControls saveFunc={this.saveView} />
                <DashboardNav current={s.page} pageChangeFunc={this.setPage} />
                <DashboardTiles>
                    {s.sensors &&
                        s.sensors.list.map((sensor, idx) => {
                            return <SensorTile rowSpan={idx + 2} colSpan={idx + 1} key={idx} sensor={sensor} />;
                        })}
                </DashboardTiles>
            </div>
        );
    }
}
