class FlowEditor extends React.Component {
    constructor(p) {
        super(p);

        this.state = {
            id: this.props.flowId || undefined,
            name: "",
            description: "",
            trigger: {},
            payload: {},
            to: {},
            sgData: { Sensor: [], Group: [] }
        };

        this.formRef = React.createRef();
    }

    componentDidMount() {
        // Load current Sensor and Group metadata to populate the selections
        jsonFetch("/api/flows/simpleGroupSensorData")
            .then(res => {
                let stateCopy = this.state;

                stateCopy.sgData = {
                    Sensor: res.sensors.map(s => {
                        return { value: s.id, display: `${s.name} (${s.dataType})` };
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

        // Load flow data if `this.props.flowId` was provided
        if (this.props.flowId && typeof this.props.flowId == "string") {
            jsonFetch("/api/flows/getbyid/" + this.props.flowId)
                .then(res => {
                    let stateCopy = this.state;

                    let flowData = res.flow;
                    if (flowData) {
                        stateCopy.name = flowData.name;
                        stateCopy.description = flowData.description;
                        stateCopy.trigger = flowData.config.trigger;
                        stateCopy.payload = flowData.config.payload;
                        stateCopy.to = flowData.config.to;
                        stateCopy.lastModDate = Date(flowData.updatedAt).toLocaleString();
                    }

                    this.setState(stateCopy);
                })
                .catch(err => {
                    messenger.notify("OpenToast", { msg: `Unable to fetch Flow Data.`, warn: true });
                    console.error(err);
                });
        }
    }

    updateRootField(field, value) {
        let newState = this.state;
        newState[field] = value;

        this.setState(newState);
    }

    updateTriggerData(data) {
        this.setState({ trigger: data });
    }
    updatePayloadData(data) {
        this.setState({ payload: data });
    }
    updateToData(data) {
        this.setState({ to: data });
    }

    submitForm(evt) {
        evt.preventDefault();

        if (!this.checkSendEnabled()) {
            messenger.notify("OpenToast", { msg: `Error creating flow. Please fill out all fields.`, warn: true });
            return;
        }

        let newFlow = {
            id: this.state.id,
            name: this.state.name,
            description: this.state.description,
            trigger: this.state.trigger,
            payload: this.state.payload,
            to: this.state.to
        };

        // Try to convert the trigger value to a number
        let valAsNum = Number(newFlow.trigger.value);
        newFlow.trigger.value = isNaN(valAsNum) ? newFlow.trigger.value : valAsNum;

        jsonFetch("/api/flows/addOrEdit", newFlow, "POST")
            .then(resp => {
                console.log(resp);
                messenger.notify("RefreshFlowList");
                messenger.notify("OpenToast", { msg: `Flow ${newFlow.name} successfully updated.` });

                // Close the modal, since we want the user to see their updates on the list.
                messenger.notify("CloseModal", { force: true });
            })
            .catch(err => {
                messenger.notify("OpenToast", { msg: `Error submitting Flow. Please try again.`, warn: true });
                console.error(err);
            });
    }

    checkSendEnabled() {
        let s = this.state;

        // A name must always be set to a non-empty value
        if (!s.name || s.name.length == 0) {
            return false;
        }

        // We must have defined a trigger type
        if (!s.trigger.type) {
            return false;
        }

        // if{}else{} is necessary, since `type` == "Time"
        // doesn't require a `comparison` value.
        if (s.trigger.type === "Time") {
            // Time must have a value, and it must be non-empty.
            // Also, at least one `day` must be set to true
            if (!s.trigger.value || s.trigger.value.time == "" || !s.trigger.value.days.includes(true)) {
                return false;
            }
        } else {
            // "Sensor" and "Group" types must have both of these.
            if (!s.trigger.comparison || !s.trigger.value) {
                return false;
            }
        }
        
        // Groups will fail if the GroupId is not set, or if the 
        // aggregate type is not set.
        // (No need to check `type`, `comparison`, or `value` since that
        // is handled in the else{} above)
        if (s.trigger.type === "Group") {
            if (!s.trigger.id || !s.trigger.aggregateType) {
                return false;
            }
        }
        
        // We must define a type and ID to send to.
        if (!s.to.id || !s.to.type) {
            return false;
        }

        return true;
    }

    render() {
        let s = this.state;

        // Display a loader while we wait for the flow's data
        // to be pulled in during componentDidMount().
        //
        // Not the best way of checking to see if data is all
        // set, but since `trigger.type` is mandatory, this should
        // generall work.
        if (this.state.id !== undefined && !this.state.trigger.type) {
            return <Loader message="Loading Flow Data..." />;
        }

        return (
            <form id="flow-builder" ref={this.formRef} onSubmit={this.submitForm.bind(this)}>
                {this.state.lastModDate && <span>Last Changed {this.state.lastModDate}</span>}
                <div className="flex-col">
                    <OnChangeInput
                        placeholder="Flow Name"
                        value={this.state.name}
                        type="text"
                        classes={["name-input"]}
                        callback={val => this.updateRootField("name", val)}
                        delay={0}
                        autoComplete={false}
                        required
                        name="flowName"
                    />
                    <OnChangeInput
                        placeholder="Flow Description"
                        value={this.state.description}
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
                        <FlowEditorTriggerBuilder
                            triggerData={this.state.trigger}
                            sensorGroupData={this.state.sgData}
                            updateFunc={this.updateTriggerData.bind(this)}
                        />
                    </div>

                    <div className="section flex-col">
                        <span className="title">Send</span>
                        <FlowEditorJsonBuilder payloadData={this.state.payload} updateFunc={this.updatePayloadData.bind(this)} />
                    </div>

                    <div className="section flex-col">
                        <span className="title">To</span>
                        <FlowEditorToBuilder
                            toData={this.state.to}
                            sensorGroupData={this.state.sgData}
                            updateFunc={this.updateToData.bind(this)}
                        />
                    </div>
                </div>
                <div className="flex-row fe ">
                    <button type="submit" className="big" disabled={!this.checkSendEnabled()}>
                        {this.props.flowId ? "Save" : "Create"}
                    </button>
                </div>
            </form>
        );
    }
}

class FlowEditorTriggerBuilder extends React.Component {
    constructor(p) {
        super(p);

        this.state = {
            type: p.triggerData.type || undefined,
            id: p.triggerData.id || undefined,
            comparison: p.triggerData.comparison || undefined,
            value: p.triggerData.value || undefined,

            // Only used for "Group" `type`'d Flows,
            // still needs to be set though.
            aggregateType: p.triggerData.aggregateType || undefined
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

        // Reset other values when changing type
        if (key === "type") {
            delete s["id"];
            delete s["value"];
            delete s["comparison"];
        }

        this.setState(s, () => {
            this.props.updateFunc(s);
        });
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
        return (
            <>
                <div className="flex-row">
                    <RadioGroup
                        key={`ttRoot_${this.state.type}`}
                        name="flow-editor-triggerType"
                        classes={["flex-row aic sb"]}
                        value={this.state.type}
                        required
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
                                key={`triggerType_${this.state.type}`}
                                placeholder={`Choose ${this.state.type}`}
                                value={this.state.id}
                                type="select"
                                disabled={this.state.type == "Time"}
                                options={this.props.sensorGroupData[this.state.type].map(o => {
                                    return { display: o.display, value: o.value };
                                })}
                                callback={val => this.updateRootField("id", val)}
                                delay={0}
                                required
                            />
                        </div>
                        <span>Is</span>
                        {this.state.type === "Group" && (
                            <OnChangeInput
                                key={`groupAggType_${this.state.type}`}
                                placeholder={"Select..."}
                                value={this.state.aggregateType}
                                type="select"
                                options={this.triggerComparisons["Group"]}
                                callback={val => this.updateRootField("aggregateType", val)}
                                delay={0}
                                required
                            />
                        )}
                        <OnChangeInput
                            key={`compType_${this.state.type}`}
                            placeholder={"Select..."}
                            value={this.state.comparison}
                            type="select"
                            options={this.triggerComparisons["Shared"]}
                            callback={val => this.updateRootField("comparison", val)}
                            delay={0}
                            required
                        />
                        <OnChangeInput
                            key={`triggerValue_${this.state.type}`}
                            placeholder="Value"
                            value={this.state.value}
                            required
                            type="text"
                            callback={val => this.updateRootField("value", val)}
                            delay={0}
                            required
                        />
                    </div>
                )}

                {this.state.type && this.state.type == "Time" && (
                    <FlowEditorTimeSelector timeData={this.props.triggerData} updateFunc={val => this.updateRootField("value", val)} />
                )}
            </>
        );
    }
}

class FlowEditorTimeSelector extends React.PureComponent {
    constructor(p) {
        super(p);

        this.state = {
            time: p.timeData ? p.timeData.value.time : "",
            days: p.timeData ? p.timeData.value.days : [false, false, false, false, false, false, false]
        };

        this.daysOfWeek = ["Sun", "Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"];
    }

    changeTime(evt) {
        this.setState({ time: evt.target.value }, () => {
            this.props.updateFunc(this.state);
        });
    }

    toggleDay(dayIdx) {
        let days = this.state.days;
        days[dayIdx] = !days[dayIdx];

        this.setState({ days: days }, () => {
            this.props.updateFunc(this.state);
        });
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
                    required
                />
                <div className="flex-row aic daypicker">
                    {this.state.days.map((val, idx) => {
                        return (
                            <div className="flex-col tac" key={"day_" + idx}>
                                <input type="checkbox" name={"cb_" + idx} checked={val === true} onChange={() => this.toggleDay(idx)} />
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
            data: p.payloadData || {}
        };
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
            this.setState({ data: current }, () => {
                this.props.updateFunc(this.state.data);
            });
        } else if (newKey === "") {
            messenger.notify("OpenToast", { msg: `Cannot set an empty Key`, warn: true });
        } else {
            messenger.notify("OpenToast", { msg: `Cannot set key ${oldKey} to ${newKey} as it already exists.`, warn: true });
        }
    }

    deleteKey(toDelete) {
        let current = this.state.data;
        delete current[toDelete];

        this.setState({ data: current }, () => {
            this.props.updateFunc(this.state.data);
        });
    }

    updateField(key, value) {
        let current = this.state.data;
        current[key] = value;

        this.setState({ data: current }, () => {
            this.props.updateFunc(this.state.data);
        });
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

class FlowEditorToBuilder extends React.Component {
    constructor(p) {
        super(p);

        this.state = {
            type: p.toData.type || undefined,
            id: p.toData.id || undefined
        };
    }

    updateRootField(key, val) {
        let s = this.state;
        s[key] = val;

        if (key === "type") {
            delete s["id"];
        }

        this.setState(s, () => {
            this.props.updateFunc(this.state);
        });
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
                    required
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
                        key={`toType_${this.state.type}`}
                        placeholder={`Choose ${this.state.type}`}
                        type="select"
                        value={this.state.id}
                        options={this.props.sensorGroupData[this.state.type].map(o => {
                            return { display: o.display, value: o.value };
                        })}
                        callback={val => this.updateRootField("id", val)}
                        delay={0}
                        required
                    />
                )}
            </div>
        );
    }
}
