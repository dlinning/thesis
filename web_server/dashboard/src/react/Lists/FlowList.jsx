class FlowList extends React.Component {
    constructor(p) {
        super(p);

        this.state = {};

        // Handles updating the "background" list
        // when using SensorEditModal component.
        messenger.subscribe("RefreshFlowList", () => {
            this.updateFlowList()
        });
    }

    componentDidMount() {
        this.updateFlowList();
    }

    updateFlowList() {
        jsonFetch("/api/flows/list")
            .then(res => {
                this.setState({ flows: res, error: null });
            })
            .catch(err => {
                messenger.notify("OpenToast", { msg: `Unable to fetch Flows`, warn: true });
                console.error(err);
            });
    }

    replaceFlowInList(newFlow) {
        let flows = this.state.flows;
        if (flows) {
            for (var n = 0, l = flows.length; n < l; n++) {
                if (flow[n].id === newFlow.id) {
                    flow[n] = newFlow;
                    this.setState({ flows: flows, error: null });
                    break;
                }
            }
        }
    }

    openFlowsEditor(flowId = undefined) {
        messenger.notify("OpenModal", {
            title: `Create New Flow`,
            content: <FlowEditor flowId={flowId}/>
        });
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
                                        <button className="small" onClick={()=>this.openFlowsEditor(flow.id)}>Manage</button>
                                        <button className="warn overlay small">Remove</button>
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
