class Dashboard extends React.Component {
    constructor(p) {
        super(p);

        this.state = {
            page: "home",
            changing: false
        };

        this.setPage = this.setPage.bind(this);
        this.saveView = this.saveView.bind(this);
    }

    setPage(pageName) {
        if (pageName !== this.state.page) {
            this.setState({ changing: true }, () => {
                setTimeout(() => {
                    this.setState({ page: pageName }, () => {
                        setTimeout(() => {
                            this.setState({ changing: false });
                        }, 110);
                    });
                }, 110);
            });
        }
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
            <div id="dashboard" className={this.state.changing === true ? " changing" : ""} data-current-page={this.state.page}>
                <DashboardControls saveFunc={this.saveView} />
                <DashboardNav current={s.page} pageChangeFunc={this.setPage} />
                <div id="dashboard-content">
                    {s.page === "home" && <HomePage />}
                    {s.page === "sensors" && <SensorsPage />}
                    {s.page === "groups" && <GroupsPage />}
                    {s.page === "settings" && <SettingsPage />}
                </div>
            </div>
        );
    }
}
