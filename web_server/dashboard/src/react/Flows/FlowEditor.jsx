class FlowEditor extends React.Component {
    constructor(p) {
        super(p);

        let fd = this.props.flow || {};
        this.state = {
            id: fd.id,
            name: fd.name || "Flow Name",
            description: fd.description || "Flow Description",
            trigger: {},
            sends: [{}],
            sgData: { sensors: [], groups: [] },
            validTriggerTypes: ["Time"]
        };

        this.triggerComparisons = {
            Sensor: [
                { value: "==", display: "Equal To" },
                { value: "!=", display: "Not Equal To" },
                { value: ">", display: ">" },
                { value: ">=", display: ">=" },
                { value: "<", display: "<" },
                { value: "<=", display: "<=" }
            ],

            Group: [{ value: "avg", display: "Average" }, { value: "sum", display: "Sum" }],

            Time: [{ value: "==", display: "Equal To" }, { value: "!=", display: "Not Equal To" }]
        };
    }

    componentDidMount() {
        jsonFetch("/api/flows/simpleGroupSensorData")
            .then(res => {
                let stateCopy = this.state;

                stateCopy.sgData = {
                    Sensor: res.sensors.map(s => {
                        return { value: s.id, display: s.name, dataType: s.dataType };
                    }),
                    Group: res.groups.map(g => {
                        return { value: g.id, display: g.name };
                    })
                };

                stateCopy.validTriggerTypes = [];
                if (res.sensors.length > 0) {
                    stateCopy.validTriggerTypes.push("Sensor");
                }
                if (res.groups.length > 0) {
                    stateCopy.validTriggerTypes.push("Group");
                }
                stateCopy.validTriggerTypes.push("Time");

                // Set default select trigger type,
                // so that the data source option is shown.
                stateCopy.trigger.type = stateCopy.validTriggerTypes[0];

                this.setState(stateCopy);
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

    updateTrigger(field, value) {
        let newTrigger = this.state.trigger;
        newTrigger[field] = value;

        this.setState({ trigger: newTrigger });
    }

    render() {
        let s = this.state;

        let compOpts = this.triggerComparisons;

        let sensorDataType = undefined;
        if (s.trigger.type === "Sensor" && s.trigger.id) {
            for (let i = 0, l = s.sgData.Sensor.length; i < l; i++) {
                if (s.sgData.Sensor[i].value === s.trigger.id) {
                    sensorDataType = s.sgData.Sensor[i].dataType;

                    break;
                }
            }
        }

        return (
            <div id="flow-builder" className="tile">
                <div className="title">New Flow</div>
                {this.props.flow && <span>Created {"DATE"}</span>}
                <OnChangeInput
                    placeholder={this.state.name}
                    type="text"
                    classes={["name-input"]}
                    callback={val => this.updateRootField("name", val)}
                    delay={0}
                    autoComplete={false}
                    name="flowName"
                />
                <OnChangeInput
                    placeholder={this.state.description}
                    type="textarea"
                    callback={val => this.updateRootField("description", val)}
                    delay={0}
                    autoComplete={false}
                    name="flowDesc"
                />

                <div className="flex-col config">
                    <div className="flex-row aic">
                        <span>When</span>
                        <RadioGroup
                            name="flow-editor-triggerType"
                            value={s.trigger.type}
                            handleChange={val => {
                                this.updateTrigger("type", val);
                            }}
                        >
                            {s.validTriggerTypes.map(type => {
                                return (
                                    <RadioOption key={type} value={type}>
                                        {type}
                                    </RadioOption>
                                );
                            })}
                        </RadioGroup>
                        {s.sgData && s.trigger.type && s.trigger.type != "Time" && (
                            <>
                                <div className="flex-col sensor-data-col">
                                    <OnChangeInput
                                        placeholder={`Choose ${s.trigger.type}`}
                                        type="select"
                                        disabled={s.trigger.type == "Time"}
                                        options={s.sgData[s.trigger.type].map(o => {
                                            return { display: o.display, value: o.value };
                                        })}
                                        callback={val => this.updateTrigger("id", val)}
                                        delay={0}
                                    />
                                    {sensorDataType && <span className="sensor-data-type">({sensorDataType})</span>}
                                </div>
                                <span>Is</span>
                                <OnChangeInput
                                    placeholder={"Select..."}
                                    type="select"
                                    options={compOpts[s.trigger.type]}
                                    callback={val => this.updateTrigger("comparison", val)}
                                    delay={0}
                                />
                                <OnChangeInput
                                    placeholder="Value"
                                    required
                                    type="text"
                                    callback={val => this.updateTrigger("value", val)}
                                    delay={0}
                                />
                            </>
                        )}
                        {s.trigger.type && s.trigger.type == "Time" && <FlowEditorTimeSelector />}
                    </div>
                </div>
            </div>
        );
    }
}

class FlowEditorTimeSelector extends React.PureComponent {
    constructor(p) {
        super(p);
    }

    render() {
        return (
            <>
                <span>[Time Selector]</span>
            </>
        );
    }
}
