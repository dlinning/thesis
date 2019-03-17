class FlowList extends React.Component {
    constructor(p) {
        super(p);

        this.state = {
            flows: [],
            error: null
        };

        // Handles updating the "background" list
        // when using SensorEditModal component.
        messenger.subscribe("RefreshFlowList", () => {
            this.updateFlowList();
        });
    }

    componentDidMount() {
        this.updateFlowList();
    }

    updateFlowList() {
        jsonFetch("/api/flows/list")
            .then(res => {
                this.setState({
                    flows: res,
                    error: null
                });
            })
            .catch(err => {
                messenger.notify("OpenToast", { msg: `Unable to fetch Flows`, warn: true });
                console.error(err);
            });
    }

    openFlowsEditor(flowId) {
        messenger.notify("OpenModal", {
            title: `Create New Flow`,
            content: <FlowEditor flowId={flowId} />
        });
    }

    removeFlow(flowId, flowName) {
        if (confirm(`Delete flow "${flowName}"?`)) {
            jsonFetch("/api/flows/" + flowId, null, "DELETE")
                .then(res => {
                    if (res.status === 200) {
                        // Delete the flow locally instead of calling updateFlowList()
                        // since we don't need any extra data
                        let allFlows = this.state.flows;
                        for (let i = 0, l = allFlows.length; i < l; i++) {
                            if (allFlows[i].id === flowId) {
                                allFlows.splice(i, 1);
                                break;
                            }
                        }

                        this.setState({ flows: allFlows });
                    }
                })
                .catch(err => {
                    messenger.notify("OpenToast", { msg: `Unable to delete Flow "${flowName}`, warn: true });
                    console.error(err);
                });
        }
    }

    render() {
        let p = this.props;

        let flows = this.state.flows;

        return (
            <div className={p.standalone ? "flex-grid cols-3" : "flex-col"}>
                {!p.standalone && (
                    <div className="flex-row aic sb title-row">
                        <h2>Flows</h2>
                        <button className="round" onClick={this.openFlowsEditor}>
                            <i className="fas fa-plus" />
                        </button>
                    </div>
                )}
                {flows &&
                    flows.length > 0 &&
                    flows.map(flow => {
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
                                        <button className="small" onClick={() => this.openFlowsEditor(flow.id)}>
                                            Manage
                                        </button>
                                        <button className="warn overlay small" onClick={() => this.removeFlow(flow.id, flow.name)}>
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                {flows && flows.length == 0 && (
                    <div className="tile">
                        <div className="title">No Flows exist</div>
                        <br />
                        <div className="content">
                            <p>Create a flow to get started</p>
                        </div>
                    </div>
                )}
            </div>
        );
    }
}
