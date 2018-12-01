class SensorEditModal extends React.Component {
    constructor(p) {
        super(p);

        this.state = {
            name: p.data.name,
            dataType: p.data.dataType,
            inGroups: p.data.groups
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

    updateField(e) {
        var newState = this.state;
        let field = e.target.name;

        if (field === "dataType") {
            newState[field] = e.target.value.toLowerCase();
        } else {
            newState[field] = e.target.value;
        }

        this.setState(newState);

        e.preventDefault();
    }

    sendUpdateToApi() {
        var payload = {
            sensorID: this.props.data.sensorId,
            name: this.state.name,
            dataType: this.state.dataType
        };
        fetch(`/api/sensors/modify`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        })
            .then(response => {
                return response.json();
            })
            .then(asJson => {
                messenger.notify("SensorUpdated", {
                    id: payload.sensorID,
                    new: asJson
                });
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
                <div className="flex-col">
                    <input name="name" type="text" value={s.name} onChange={this.updateField} />
                    <select name="dataType" onChange={this.updateField} value={s.dataType}>
                        {this.possibleDataTypes.map((dt, idx) => {
                            return (
                                <option value={dt} key={idx}>
                                    {dt}
                                </option>
                            );
                        })}
                    </select>
                </div>
                <div className="flex-row">
                    <button onClick={() => this.sendUpdateToApi()}>Apply</button>
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
                                    <button className="small overlay danger" onClick={this.removeFromGroup.bind(this, g.id)}>
                                        <i className="fas fa-trash-alt" />
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
