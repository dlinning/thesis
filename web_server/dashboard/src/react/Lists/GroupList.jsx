class GroupList extends React.Component {

    // TODO: Removing groups

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
                                        <button className="small overlay danger">
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
