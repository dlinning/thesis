class SensorEditModal extends React.Component {
    constructor(p) {
        super(p);

        this.state = {
            name: p.data.name,
            dataType: p.data.dataType,
            inGroups: p.data.groups,
            message: null
        };

        // Note: make sure this matches up with
        // values in `common/helpers/dataTypeHelper.js` if making changes.
        this.possibleDataTypes = ["string", "float", "int", "blob", "image", "json", "boolean", "list"];

        this.updateField = this.updateField.bind(this);
    }

    componentDidMount() {
        this.updateGroups();
    }

    // Pass a `newGroups` to override what is in
    // the current state.
    updateGroups(newGroups = this.state.inGroups) {
        var groupsIn = newGroups.map(g => {
            return g.id;
        });
        var groupsNotIn = this.props.allGroups.filter(g => {
            if (!groupsIn.includes(g.id)) {
                return g;
            }
        });

        this.setState({ groupsNotIn: groupsNotIn, inGroups: newGroups });
    }

    updateField(field, val) {
        var newState = this.state;

        if (field === "dataType") {
            newState[field] = val.toLowerCase();
        } else {
            newState[field] = val;
        }

        newState.message = null;

        this.setState(newState);
    }

    sendUpdateToApi() {
        var payload = {
            sensorID: this.props.data.sensorId,
            name: this.state.name,
            dataType: this.state.dataType
        };
        jsonFetch("/api/sensors/modify", payload, "POST")
            .then(resp => {
                messenger.notify("SensorUpdated", {
                    id: payload.sensorID,
                    updatedSensor: resp.updatedSensor
                });

                messenger.notify("OpenToast", { msg: `Sensor ${this.state.name} successfully updated` });
            })
            .catch(err => {
                console.error(err);
                messenger.notify("OpenToast", { msg: `Unable to update sensor: ${this.state.name}`, warn: true });
                this.setState({ message: "Unable to update sensor" });
            });
    }

    addToGroup(evt) {
        evt.preventDefault();

        const data = new FormData(evt.target);

        var payload = {
            sensorID: this.props.data.sensorId,
            groupID: data.get("groupId")
        };

        jsonFetch("/api/sensors/addToGroup", payload, "POST")
            .then(resp => {
                this.updateGroups(resp.groups);
                
                messenger.notify("SensorGroupsUpdated", {
                    id: payload.sensorID,
                    groups: resp.groups
                });
            })
            .catch(err => {
                console.error(err);
            });
    }

    removeFromGroup(groupId, evt) {
        evt.preventDefault();

        var payload = {
            sensorID: this.props.data.sensorId,
            groupID: groupId
        };

        jsonFetch("/api/sensors/removeFromGroup", payload, "POST")
            .then(resp => {
                messenger.notify("SensorGroupsUpdated", {
                    id: payload.sensorID,
                    groups: resp.groups
                });
                this.updateGroups(resp.groups);
            })
            .catch(err => {
                console.error(err);
            });
    }

    render() {
        let s = this.state;
        return (
            <div className="editSensorModal">
                <div className="flex-col name-dt-section">
                    <div className="flex-row aic jcc">
                        <span>Sensor Name:</span>
                        <OnChangeInput value={s.name} callback={val => this.updateField("name", val)} type="text" name="name" />
                    </div>
                </div>
                <div className="flex-col aic">
                    <button onClick={() => this.sendUpdateToApi()}>Apply</button>
                    {s.message && <div className="esm-msg">{s.message}</div>}
                </div>

                <div className="editSensorModal-groups">
                    <span className="title">Groups</span>

                    <div className="editSensorModal-addToGroup flex-row aic se">
                        {s.groupsNotIn && s.groupsNotIn.length > 0 && (
                            <>
                                <span>Add To Group:</span>
                                <form onSubmit={this.addToGroup.bind(this)}>
                                    <select name="groupId">
                                        {s.groupsNotIn.map((g, idx) => {
                                            return (
                                                <option value={g.id} key={idx}>
                                                    {g.name}
                                                </option>
                                            );
                                        })}
                                    </select>
                                    <button>Add</button>
                                </form>
                            </>
                        )}
                    </div>

                    {s.inGroups &&
                        s.inGroups.map((g, idx) => {
                            return (
                                <div className="editSensorModal-g" key={idx}>
                                    <span className="name">{g.name}</span>
                                    <button className="small overlay warn" onClick={this.removeFromGroup.bind(this, g.id)}>
                                        <span>Remove</span>
                                    </button>
                                </div>
                            );
                        })}
                </div>
            </div>
        );
    }
}
