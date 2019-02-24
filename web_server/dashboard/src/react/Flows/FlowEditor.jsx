class FlowEditor extends React.Component {
    constructor(p) {
        super(p);

        let fd = this.props.flow || {};
        this.state = {
            id: fd.id,
            name: fd.name || "Flow Name",
            description: fd.description || "Flow Description",
            triggers: [{}],
            sends: [{}],
            sgData: { sensors: [], groups: [] }
        };

        this.triggerComparisons = {
            number: [
                { value: "==", display: "Equal To" },
                { value: "!=", display: "Not Equal To" },
                { value: ">", display: "Greater Than" },
                { value: ">=", display: "Greater Than / Equal To" },
                { value: "<", display: "Less Than" },
                { value: "<=", display: "Less Than / Equal To" }
            ],

            string: [
                { value: "==", display: "Equal To" },
                { value: "!=", display: "Not Equal To" },
                { value: ">", display: "Contains" },
                { value: ">=", display: "Starts With" },
                { value: "<", display: "Ends With" }
            ],

            string: [
                { value: "==", display: "Equal To" },
                { value: "!=", display: "Not Equal To" },
                { value: ">", display: "Contains" },
                { value: ">=", display: "Starts With" },
                { value: "<", display: "Ends With" }
            ],

            Group: [{ value: "avg", display: "Average" }, { value: "sum", display: "Sum" }],

            Time: [{ value: "==", display: "Equal To" }, { value: "!=", display: "Not Equal To" }]
        };
    }

    componentDidMount() {
        jsonFetch("/api/flows/simpleGroupSensorData")
            .then(res => {
                this.setState({
                    sgData: {
                        sensors: res.sensors.map(s => {
                            return { value: s.id, display: s.name, dataType: s.dataType };
                        }),
                        groups: res.groups.map(g => {
                            return { value: g.id, display: g.name };
                        })
                    }
                });
            })
            .catch(err => {
                messenger.notify("OpenToast", { msg: `Unable to fetch Sensor and Group data`, warn: true });
                console.error(err);
            });
    }

    updateRootField(field, value) {
        let newState = this.state;
        newState[field] = value;
        this.setState(newState);
    }

    updateTrigger(idx, field, value) {
        let newTriggers = this.state.triggers;
        newTriggers[idx][field] = value;
        this.setState({ triggers: newTriggers });
    }

    render() {
        let s = this.state;

        let compOpts = this.triggerComparisons;

        let triggerTypeOpts = [];
        this.state.sgData.sensors.length > 0 && triggerTypeOpts.push({ display: "Sensor", value: "sensors" });
        this.state.sgData.groups.length > 0 && triggerTypeOpts.push({ display: "Group", value: "groups" });
        triggerTypeOpts.push("Time");

        return (
            <div id="flow-builder" className="tile">
                <div className="title">New Flow</div>
                {this.props.flow && <span>Created {"DATE"}</span>}
                <OnChangeInput
                    placeholder={this.state.name}
                    type={"text"}
                    callback={val => this.updateRootField("name", val)}
                    delay={0}
                    autoComplete={false}
                    name="flowName"
                />
                <OnChangeInput
                    placeholder={this.state.description}
                    type={"textarea"}
                    callback={val => this.updateRootField("description", val)}
                    delay={0}
                    autoComplete={false}
                    name="flowDesc"
                />

                <div className="flex-col">
                    {
                        //TODO: Make this stinkin form
                    }
                </div>
            </div>
        );
    }
}
