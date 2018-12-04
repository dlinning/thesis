class DashboardControls extends React.Component {
    constructor(p) {
        super(p);

        this.state = {
            views: null
        };
    }
    componentDidMount() {
        jsonFetch("/api/views/list")
            .then(resp => {
                this.setState({ views: resp });
            })
            .catch(err => {
                console.err(err);
            });
    }

    changeView(evt) {
        this.props.changeViewFunc(evt.target.value);
    }

    render() {
        let s = this.state;
        return (
            <div className="dashboard-controls">
                {this.props.currentPage === "home" && (
                    <>
                        <select name="groupId" onChange={this.changeView.bind(this)} value={this.props.currentView}>
                            {s.views &&
                                s.views.map((v, idx) => {
                                    return (
                                        <option value={v.name} key={idx}>
                                            {v.name}
                                        </option>
                                    );
                                })}
                        </select>
                        <button onClick={() => alert("Opening Add View Modal")}>
                            <i className="fas fa-plus" />
                            <span>New View</span>
                        </button>
                    </>
                )}
            </div>
        );
    }
}
