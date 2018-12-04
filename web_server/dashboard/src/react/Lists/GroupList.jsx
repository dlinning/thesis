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
                                    <OnChangeInput
                                        initialValue={g.name}
                                        classes={["g-name"]}
                                        callback={newValue => {
                                            if (newValue.length > 0) {
                                                // No .then(), since the change is already reflected client-side
                                                jsonFetch("/api/groups/createorupdate", { groupName: newValue, uuid: g.id }, "POST").catch(
                                                    err => {
                                                        console.error(err);
                                                    }
                                                );
                                            }
                                        }}
                                    />
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
