class GroupList extends React.Component {
    removeGroup(groupId, deleteWithSensors = "") {
        jsonFetch(`/api/groups/delete/${groupId}/${deleteWithSensors}`, null, "DELETE")
            .then(resp => {
                if (resp.group && resp.group.hasSensors) {
                    // Verify the user wants to remove a sensor that has logged data
                    var r = confirm(
                        `Are you sure you want to delete group with ID:\n${groupId}\nas it has sensors assigned to it?\nThis will NOT delete the sensors, only remove them from this group.`
                    );
                    if (r == true) {
                        // Force the remove
                        this.removeGroup(groupId, true);
                    }
                } else {
                    // Sensor was removed, either by previous prompt
                    // or it never had logs in the first place
                    this.props.groupRemoveCallback();
                }
            })
            .catch(err => {
                console.error(err);
            });
    }

    //

    render() {
        let groups = this.props.groups;
        if (groups === undefined || groups.length === 0) {
            return null;
        }

        return (
            <>
                {groups.length > 0 && (
                    <div className="dashboard-tiles">
                        {groups.map(group => {
                            let g = group;
                            return (
                                <div className="g-tile flex-col" key={g.id}>
                                    <GroupNameField name={g.name} id={g.id} />
                                    <div className="g-id" title={g.id}>
                                        ({g.id.substr(0, 7)}...)
                                    </div>
                                    <div className="g-sc">
                                        <span className="label">Sensors: </span>
                                        <span>{g.sensorCount || 0}</span>
                                    </div>
                                    <div className="g-controls flex-row">
                                        <button className="small overlay danger" onClick={() => this.removeGroup(g.id)}>
                                            <i className="fas fa-trash-alt" />
                                            <span>Remove</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
                {groups.length === 0 && <p>You have no groups currently created.</p>}
            </>
        );
    }
}

class GroupNameField extends React.Component {
    constructor(p) {
        super(p);

        this.initialName = p.name;

        this.updateTimer = null;

        this.state = {
            name: p.name
        };
    }

    updateGroupName(evt) {
        var newName = evt.target.value || "";

        this.setState({ name: newName });

        // Make it so updates are only sent every 300ms,
        // once the user has stopped updating.
        clearTimeout(this.updateTimer);
        this.updateTimer = setTimeout(() => {
            if (newName.length > 0) {
                jsonFetch("/api/groups/createorupdate", { groupName: newName, uuid: this.props.id }, "POST")
                    .then(resp => {
                        console.log(resp);
                    })
                    .catch(err => {
                        console.error(err);
                    });
            }
        }, 300);
    }

    render() {
        return <input className="g-name" type="text" value={this.state.name} onChange={this.updateGroupName.bind(this)} />;
    }
}
