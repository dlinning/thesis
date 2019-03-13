class FlowEditor extends React.Component {
    constructor(p) {
        super(p);

        let fd = this.props.flow || {};
        this.state = {
            id: fd.id,
            name: fd.name || "Flow Name",
            description: fd.description || "Flow Description",
            trigger: {},
            send: {},
            sgData: { sensors: [], groups: [] },
            validTriggerTypes: ["Time"]
        };

        this.triggerComparisons = {
            Shared: [
                { value: "==", display: "==" },
                { value: "!=", display: "!=" },
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

        //
        //TODO: Have field == "type" changes update the trigger/send ID
        //

        this.setState({ trigger: newTrigger });
    }

    updateSend(field, value) {
        let newSend = this.state.send;
        newSend[field] = value;

        //
        //TODO: Have field == "type" changes update the trigger/send ID
        //

        this.setState({ send: newSend });
    }

    updateSendData(data) {
        this.setState({ send: JSON.stringify(data) });
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
                    <div className="section flex-row aic">
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
                                {s.trigger.type === "Group" && (
                                    <OnChangeInput
                                        placeholder={"Select..."}
                                        type="select"
                                        options={compOpts["Group"]}
                                        callback={val => this.updateTrigger("comparison", val)}
                                        delay={0}
                                    />
                                )}
                                <OnChangeInput
                                    placeholder={"Select..."}
                                    type="select"
                                    options={compOpts["Shared"]}
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

                    <div className="section flex-row aic">
                        <span>Send</span>
                        <FlowEditorJsonBuilder sendDataUpFunc={this.updateSendData.bind(this)} />
                    </div>

                    <div className="section flex-row aic">
                        <span>To</span>

                        <RadioGroup
                            name="flow-editor-triggerType"
                            value={s.send.type}
                            handleChange={val => {
                                this.updateSend("type", val);
                            }}
                        >
                            {s.validTriggerTypes.slice(0, 2).map(type => {
                                return (
                                    <RadioOption key={type} value={type}>
                                        {type}
                                    </RadioOption>
                                );
                            })}
                        </RadioGroup>

                        {s.sgData && s.send.type && (
                            <OnChangeInput
                                placeholder={`Choose ${s.send.type}`}
                                type="select"
                                options={s.sgData[s.send.type].map(o => {
                                    return { display: o.display, value: o.value };
                                })}
                                callback={val => this.updateSend("id", val)}
                                delay={0}
                            />
                        )}
                    </div>
                </div>
            </div>
        );
    }
}

class FlowEditorTimeSelector extends React.PureComponent {
    constructor(p) {
        super(p);

        this.state = {
            h: 12,
            m: 0,
            s: 0,
            days: [false, false, false, false, false, false, false]
        };

        this.daysOfWeek = ["Sun", "Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"];
    }

    bubbleUp() {
        this.state.sendTimeUpFunc(this.state.data);
    }

    changeTime(key, evt) {
        let temp = this.state;

        temp[key] = Number(evt.target.value);

        this.setState(temp);
    }
    toggleDay(dayIdx) {
        let days = this.state.days;
        days[dayIdx] = !days[dayIdx];
        this.setState({ days: days });
    }

    render() {
        return (
            <div className="flex-col">
                <div className="flex-row aic">
                    <input type="number" min="0" max="23" step="1" defaultValue="12" onChange={evt => this.changeTime("h", evt)} />
                    <span>:</span>
                    <input type="number" min="0" max="59" step="1" defaultValue="0" onChange={evt => this.changeTime("m", evt)} />
                    <span>:</span>
                    <input type="number" min="0" max="59" step="1" defaultValue="0" onChange={evt => this.changeTime("s", evt)} />
                </div>
                <div className="flex-row aic daypicker">
                    {this.state.days.map((val, idx) => {
                        return (
                            <div className="flex-col tac" key={"day_" + idx}>
                                <input
                                    type="checkbox"
                                    name={"cb_" + idx}
                                    checked={val === true ? "true" : undefined}
                                    onChange={() => this.toggleDay(idx)}
                                />
                                <label className="label" htmlFor={"cb_" + idx}>
                                    {this.daysOfWeek[idx]}
                                </label>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
}

class FlowEditorJsonBuilder extends React.Component {
    constructor(p) {
        super(p);

        this.state = {
            // Will just be a bunch of K/V pairs
            data: {}
        };
    }

    bubbleUp() {
        this.sendDataUpFunc(this.state.data);
    }

    // Removes `oldKey` from the current data,
    // copying the data into `this.state.data[newKey]`
    updateKeyName(oldKey, newKey) {
        let current = this.state.data;

        if (current[newKey] == undefined && newKey != "") {
            current[newKey] = "";

            // Delete `oldKey` if provided.
            if (oldKey !== undefined) {
                delete Object.assign(current, { [newKey]: current[oldKey] })[oldKey];
            }
            this.setState({ data: current });
        } else if (newKey === "") {
            messenger.notify("OpenToast", { msg: `Cannot set an empty Key`, warn: true });
        } else {
            messenger.notify("OpenToast", { msg: `Cannot set key ${oldKey} to ${newKey} as it already exists.`, warn: true });
        }
    }
    deleteKey(toDelete) {
        let current = this.state.data;
        delete current[toDelete];

        this.setState({ data: current });
    }

    updateField(key, value) {
        let current = this.state.data;
        current[key] = value;

        this.setState({ data: current });
    }

    renderKeyValuePair(key, index) {
        return (
            <div className="flex-row aic" key={index}>
                <input placeholder="Key" key={index + "_k"} value={key} onChange={evt => this.updateKeyName(key, evt.target.value)} />
                <input
                    placeholder="Value"
                    key={index + "_v"}
                    value={this.state.data[key] || ""}
                    required={key != ""}
                    title={key != "" ? `Set a value for key ${key}` : ""}
                    onChange={evt => this.updateField(key, evt.target.value)}
                />
                <button className="round" onClick={() => this.deleteKey(key)}>
                    <i className="fas fa-times" />
                </button>
            </div>
        );
    }

    render() {
        let currentKeys = Object.keys(this.state.data),
            lastKeyData = this.state.data[currentKeys[currentKeys.length - 1]];

        // Add a new "empty" KVPair if the 'last' one isn't
        // doesn't have an empty value. This forces
        // all Keys to have values before adding another.

        if (currentKeys.length == 0 || lastKeyData !== undefined || lastKeyData !== "") {
            currentKeys.push("");
        }

        return (
            <div className="flex-col json-kvpairs">
                <p className="label">
                    These Key Value pairs represent a JSON object that will be send to the corresponding sensor or group.
                </p>
                <p className="label">%VALUE%, %SENSORID%, %GROUPID% and %TIME% are all available to send in Value fields.</p>
                {currentKeys.map((key, idx) => {
                    return this.renderKeyValuePair(key, idx);
                })}
            </div>
        );
    }
}
