class Dashboard extends React.Component {
    constructor(p) {
        super(p);

        this.state = {
            page: this.props.page || "home",
            view: "default",
            changing: false
        };

        this.setPage = this.setPage.bind(this);

        window.onpopstate = evt => {
            var newPage = document.location.pathname.substring(1);
            if (newPage.length === 0) {
                newPage = "home";
            }
            this.setPage(newPage, false);
        };
    }

    setPage(pageName, pushHistory = true, viewName = null) {
        if (pageName !== this.state.page) {
            this.setState({ changing: true }, () => {
                setTimeout(() => {
                    this.setState({ page: pageName }, () => {
                        pushHistory && history.pushState({ page: pageName }, pageName, "/" + (pageName === "home" ? "" : pageName));

                        setTimeout(() => {
                            this.setState({ changing: false });
                        }, 110);
                    });
                }, 110);
            });
        }
    }

    changeView(toViewName) {
        this.setState({ view: toViewName });
    }

    render() {
        var s = this.state;
        return (
            <div id="dashboard" className={this.state.changing === true ? " changing" : ""} data-current-page={this.state.page}>
                <DashboardSidebar currentPage={s.page} pageChangeFunc={this.setPage} />
                <div id="dashboard-content">
                    {s.page === "home" && <HomePage />}
                    {s.page === "flows" && <FlowsPage />}
                    {s.page === "sensors" && <SensorsPage />}
                    {s.page === "groups" && <GroupsPage />}
                    {s.page === "settings" && <SettingsPage />}
                </div>
            </div>
        );
    }
}
