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
            sgData: { Sensor: [], Group: [] }
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

    updateSendData(data) {
        this.setState({ send: JSON.stringify(data) });
    }

    render() {
        let s = this.state;

        return (
            <div id="flow-builder">
                {this.props.flowId && <span>Last Changed {"DATE"}</span>}
                <div className="flex-col">
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
                </div>

                <div className="config flex-col">
                    <div className="section flex-col">
                        <span className="title">When</span>
                        <FlowEditorTriggerBuilder sensorGroupData={this.state.sgData} />
                    </div>

                    <div className="section flex-col">
                        <span className="title">Send</span>
                        <FlowEditorJsonBuilder sendDataUpFunc={this.updateSendData.bind(this)} />
                    </div>

                    <div className="section flex-col">
                        <span className="title">To</span>
                        <FlowEditorSendBuilder sensorGroupData={this.state.sgData} />
                    </div>
                </div>
            </div>
        );
    }
}

class FlowEditorTriggerBuilder extends React.Component {
    constructor(p) {
        super(p);

        this.state = {
            type: undefined,
            id: undefined,
            comparison: undefined,
            value: undefined
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

    updateRootField(key, val) {
        let s = this.state;
        s[key] = val;

        if (key === "type") {
            delete s["id"];
        }

        this.setState(s);
    }

    bubbleUp() {
        this.state.sendTimeUpFunc(this.state.data);
    }

    getValidTriggerTypes() {
        let validTriggerTypes = [];
        if (this.props.sensorGroupData) {
            Object.keys(this.props.sensorGroupData).map(key => {
                if (this.props.sensorGroupData[key].length > 0) {
                    validTriggerTypes.push(key);
                }
            });
        }
        validTriggerTypes.push("Time");

        return validTriggerTypes;
    }

    render() {
        let sensorDataType = undefined;
        if (this.state.type === "Sensor" && this.state.id !== undefined) {
            this.props.sensorGroupData["Sensor"].forEach(sensor => {
                if (sensor.id == this.state.id) {
                    sensorDataType = sensors.dataType;
                }
            });
        }

        return (
            <>
                <div className="flex-row">
                    <RadioGroup
                        name="flow-editor-triggerType"
                        classes={["flex-row aic sb"]}
                        value={this.state.type}
                        handleChange={val => {
                            this.updateRootField("type", val);
                        }}
                    >
                        {this.getValidTriggerTypes().map(type => {
                            return (
                                <RadioOption key={type} value={type}>
                                    {type}
                                </RadioOption>
                            );
                        })}
                    </RadioGroup>
                </div>
                <br />

                {this.state.type && this.state.type !== "Time" && (
                    <div className="flex-row aic">
                        <div className="flex-col sensor-data-col">
                            <OnChangeInput
                                placeholder={`Choose ${this.state.type}`}
                                type="select"
                                disabled={this.state.type == "Time"}
                                options={this.props.sensorGroupData[this.state.type].map(o => {
                                    return { display: o.display, value: o.value };
                                })}
                                callback={val => this.updateRootField("id", val)}
                                delay={0}
                            />
                            {sensorDataType && <span className="sensor-data-type">({sensorDataType})</span>}
                        </div>
                        <span>Is</span>
                        {this.state.type === "Group" && (
                            <OnChangeInput
                                placeholder={"Select..."}
                                type="select"
                                options={this.triggerComparisons["Group"]}
                                callback={val => this.updateRootField("comparison_type", val)}
                                delay={0}
                            />
                        )}
                        <OnChangeInput
                            placeholder={"Select..."}
                            type="select"
                            options={this.triggerComparisons["Shared"]}
                            callback={val => this.updateRootField("comparison", val)}
                            delay={0}
                        />
                        <OnChangeInput
                            placeholder="Value"
                            required
                            type="text"
                            callback={val => this.updateRootField("value", val)}
                            delay={0}
                        />
                    </div>
                )}

                {this.state.type && this.state.type == "Time" && <FlowEditorTimeSelector />}
            </>
        );
    }
}

class FlowEditorTimeSelector extends React.PureComponent {
    constructor(p) {
        super(p);

        this.state = {
            time: undefined,
            days: [false, false, false, false, false, false, false]
        };

        this.daysOfWeek = ["Sun", "Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"];
    }

    bubbleUp() {
        this.state.sendTimeUpFunc(this.state.data);
    }

    changeTime(evt) {
        this.setState({ time: evt.target.value });
    }

    toggleDay(dayIdx) {
        let days = this.state.days;
        days[dayIdx] = !days[dayIdx];

        this.setState({ days: days });
    }

    render() {
        return (
            <div className="flex-row aic">
                <input
                    type="time"
                    value={this.state.time}
                    onChange={evt => {
                        this.changeTime(evt);
                    }}
                />
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
                <p>
                    These Key Value pairs represent a JSON object that will be sent to the corresponding sensor or group. <br />
                    %VALUE%, %SENSORID%, %GROUPID% and %TIME% are all available to send in Value fields.
                </p>
                {currentKeys.map((key, idx) => {
                    return this.renderKeyValuePair(key, idx);
                })}
            </div>
        );
    }
}

class FlowEditorSendBuilder extends React.Component {
    constructor(p) {
        super(p);

        this.state = {
            type: undefined,
            id: undefined
        };
    }

    updateRootField(key, val) {
        let s = this.state;
        s[key] = val;

        if (key === "type") {
            delete s["id"];
        }

        this.setState(s);
    }

    bubbleUp() {
        this.state.sendTimeUpFunc(this.state.data);
    }

    getValidSendTypes() {
        let validSendTypes = [];
        if (this.props.sensorGroupData) {
            Object.keys(this.props.sensorGroupData).map(key => {
                if (this.props.sensorGroupData[key].length > 0) {
                    validSendTypes.push(key);
                }
            });
        }

        return validSendTypes;
    }

    render() {
        return (
            <div className="flex-col">
                <RadioGroup
                    name="flow-editor-triggerType"
                    classes={["flex-row"]}
                    value={this.state.type}
                    handleChange={val => {
                        this.updateRootField("type", val);
                    }}
                >
                    {this.getValidSendTypes().map(type => {
                        return (
                            <RadioOption key={type} value={type}>
                                {type}
                            </RadioOption>
                        );
                    })}
                </RadioGroup>

                <br />

                {this.state.type && this.state.type !== "Email" && (
                    <OnChangeInput
                        placeholder={`Choose ${this.state.type}`}
                        type="select"
                        initialValue={this.state.id}
                        options={this.props.sensorGroupData[this.state.type].map(o => {
                            return { display: o.display, value: o.value };
                        })}
                        callback={val => this.updateRootField("id", val)}
                        delay={0}
                    />
                )}
            </div>
        );
    }
}
