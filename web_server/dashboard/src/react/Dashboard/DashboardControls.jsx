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
        console.log('Changing view to', evt.target.value);
    }

    render() {
        let s = this.state;
        return (
            <div className="dashboard-controls">
                <select name="groupId" onChange={this.changeView}>
                    {s.views &&
                        s.views.map((v, idx) => {
                            return (
                                <option value={v.id} key={idx}>
                                    {v.name}
                                </option>
                            );
                        })}
                </select>
                <button onClick={() => alert("Opening Tile Create Modal")}>
                    <i className="fas fa-plus" />
                    <span>New Tile</span>
                </button>
            </div>
        );
    }
}
