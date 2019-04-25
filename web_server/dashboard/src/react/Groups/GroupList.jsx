class GroupList extends React.Component {
    constructor(p) {
        super(p);

        this.state = {
            groups: undefined,
            error: undefined
        };
    }

    componentDidMount() {
        this.updateGroups();
    }

    updateGroups() {
        jsonFetch("/api/groups/list")
            .then(resp => {
                this.setState({ groups: resp, error: undefined });
            })
            .catch(err => {
                messenger.notify("OpenToast", { msg: `Unable to fetch Groups`, warn: true });
                console.error(err);
            });
    }

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
                    this.updateGroups();
                }
            })
            .catch(err => {
                console.error(err);
            });
    }

    openAddGroupModal() {
        messenger.notify("OpenModal", {
            title: `Make a New Group`,
            content: <GroupAddForm groupAddCallback={this.updateGroups.bind(this)} />
        });
    }

    onGroupLogModal(groupId) {
        jsonFetch("/api/groups/logs/" + groupId)
            .then(resp => {
                messenger.notify("OpenModal", {
                    title: `Logs For Group: ${groupId.substr(0, 6)}...`,
                    content: <LogList entries={resp} exportTitle={`GroupLogs_${groupId}`} />
                });
            })
            .catch(err => {
                console.error(err);
            });
    }

    //

    render() {
        let groups = this.state.groups;
        if (groups === undefined) {
            return null;
        }

        return (
            <>
                {this.props.standalone && (
                    <button className="page-add-btn" onClick={this.openAddGroupModal.bind(this)}>
                        Create New Group
                    </button>
                )}
                <div className={this.props.standalone ? "flex-grid" : "flex-col"}>
                    {!this.props.standalone && (
                        <div className="flex-row aic sb title-row">
                            <h2>Groups</h2>
                            <button className="round" onClick={this.openAddGroupModal.bind(this)}>
                                <span>&#43;</span>
                            </button>
                        </div>
                    )}
                    {groups &&
                        groups.length > 0 &&
                        groups.map(group => {
                            let g = group;
                            return (
                                <div className="tile" key={`group_${g.id}`}>
                                    <OnChangeInput
                                        value={g.name}
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
                                    <div className="desc">
                                        <span title={g.id}>({g.id.substr(0, 6)})</span>
                                    </div>
                                    <div className="content">
                                        <div className="data-module clickable" title="View logs" onClick={() => this.onGroupLogModal(g.id)}>
                                            <span className="value">{g.logCount}</span>
                                            <span className="label">Log Count</span>
                                        </div>
                                        <div className="data-module">
                                            <span className="value">{g.sensorCount}</span>
                                            <span className="label">Sensors</span>
                                        </div>
                                        <div className="data-module">
                                            <button className="warn overlay small" onClick={() => this.removeGroup(g.id)}>
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    {groups.length === 0 && (
                        <div className="tile">
                            <div className="title">No Groups Created</div>
                            <br />
                            <div className="content">
                                <p>Groups are used to organize your Sensors. Groups can also be used in Flows.</p>
                            </div>
                        </div>
                    )}
                </div>
            </>
        );
    }
}

class GroupAddForm extends React.Component {
    createGroup(evt) {
        evt.preventDefault();

        const data = new FormData(evt.target);

        var payload = {
            groupName: data.get("name")
        };

        jsonFetch("/api/groups/createorupdate", payload, "POST")
            .then(resp => {
                console.log(resp);
                if (resp.status === 200) {
                    messenger.notify("CloseModal", true);
                    messenger.notify("OpenToast", { msg: `Created Group "${payload.groupName}"` });
                    this.props.groupAddCallback();
                } else {
                    console.error("Error creating group:", resp);
                    messenger.notify("OpenToast", { msg: `Unable to create Group "${payload.groupName}"`, warn: true });
                }
            })
            .catch(err => {
                console.error(err);
            });
    }
    render() {
        return (
            <form className="flex-col group-add-form" onSubmit={this.createGroup.bind(this)}>
                <p>Groups are used as logical organizers for Sensors.</p>
                <p>A Sensor can belong to zero or more Groups. There is no extra setup needed on the individual Sensors.</p>
                <p>The name of a Group can be changed at any time without removing Sensors from the group.</p>
                <div className="flex-col aic">
                    <input type="text" placeholder="Group Name" name="name" />
                    <button>
                        <span>Create</span>
                    </button>
                </div>
            </form>
        );
    }
}
