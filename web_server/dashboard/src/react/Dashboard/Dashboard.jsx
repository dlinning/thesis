class Dashboard extends React.Component {
    constructor(p) {
        super(p);

        this.state = {
            page: this.props.page || "home",
            changing: false
        };


        window.onpopstate = () => {
            var newPage = document.location.pathname.substring(1);
            if (newPage.length === 0) {
                newPage = "home";
            }
            this._setPage(newPage, false);
        };

        messenger.subscribe("ChangePage", toPage => {
            this._setPage(toPage);
        });
    }

    _setPage(pageName, pushHistory = true) {
        if (pageName !== this.state.page) {
            this.setState({ changing: true }, () => {
                messenger.notify("CloseModal", true);
                setTimeout(() => {
                    this.setState({ page: pageName }, () => {
                        pushHistory && history.pushState({ page: pageName }, pageName, "/" + (pageName === "home" ? "" : pageName));

                        document.title = `Simple IoT - ${pageName.capitalize()}`;

                        setTimeout(() => {
                            this.setState({ changing: false });
                        }, 110);
                    });
                }, 110);
            });
        }
    }

    render() {
        var s = this.state;
        let pageChildren = null,
            pageId = s.page;
        if (s.page == "home") {
            pageId = "home-lists";
            pageChildren = (
                <>
                    <FlowList />
                    <SensorList />
                    <GroupList />
                </>
            );
        } else if (s.page == "flows") {
            pageChildren = <FlowList standalone={true} />;
        } else if (s.page == "sensors") {
            pageChildren = <SensorList standalone={true} />;
        } else if (s.page == "groups") {
            pageChildren = <GroupList standalone={true} />;
        } else if (s.page == "settings") {
            pageChildren = <SettingsPage />;
        }

        return (
            <div id="dashboard" className={this.state.changing === true ? " changing" : ""} data-current-page={this.state.page}>
                <DashboardSidebar currentPage={s.page} />
                <div id="dashboard-content" className={`container-${s.page}`}>
                    <DashboardPage title={s.page} pageId={pageId}>
                        {pageChildren}
                    </DashboardPage>
                </div>
                <Toast />
            </div>
        );
    }
}
