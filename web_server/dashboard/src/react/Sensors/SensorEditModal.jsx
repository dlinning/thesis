class SensorEditModal extends React.Component {
    constructor(p) {
        super(p);

        this.state = {
            name: p.data.name,
            dataType: p.data.dataType
        };

        // Note: make sure this matches up with
        // values in `common/helpers/dataTypeHelper.js` if making changes.
        this.possibleDataTypes = ["string", "float", "int", "blob", "image", "json", "boolean", "list"];

        this.updateField = this.updateField.bind(this);
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
                return response.json(); // .text();
            })
            .then(asJson => {
                messenger.notify("SensorUpdated", {
                    id: payload.sensorID,
                    new: asJson
                });
            });
    }

    removeFromGroup(e) {
        console.log(e.target);
        console.log(`Removing from ${e.target.datset.groupId}`);

        e.preventDefault();
    }

    render() {
        return (
            <div className="editSensorModal">
                <div className="flex-col">
                    <input name="name" type="text" value={this.state.name} onChange={this.updateField} />
                    <select name="dataType" onChange={this.updateField} value={this.state.dataType}>
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
                    {this.props.data.groups &&
                        this.props.data.groups.map((g, idx) => {
                            return (
                                <div className="editSensorModal-g" key={idx}>
                                    <span className="name">{g.name}</span>
                                    <button className="small overlay danger" data-group-id={g.id} onClick={this.removeFromGroup}>
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
