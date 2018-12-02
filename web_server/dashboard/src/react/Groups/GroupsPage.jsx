class GroupsPage extends React.Component {
    constructor(p) {
        super(p);

        this.state = {};
    }

    componentDidMount() {
        this.updateGroups();
    }
    updateGroups() {
        jsonFetch("/api/groups/list")
            .then(resp => {
                this.setState({ groups: resp });
            })
            .catch(err => {
                console.error(err);
            });
    }

    render() {
        var s = this.state;
        return (
            <>
                <h1>Manage Groups</h1>
                <GroupAddForm groupAddCallback={this.updateGroups.bind(this)} />
                <GroupList groups={s.groups} groupRemoveCallback={this.updateGroups.bind(this)}/>
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
            .then(() => {
                this.props.groupAddCallback();
            })
            .catch(err => {
                console.error(err);
            });
    }
    render() {
        return (
            <form className="flex-row aic group-add-form" onSubmit={this.createGroup.bind(this)}>
                <h3>Create New Group</h3>
                <input type="text" placeholder="Group Name" name="name" />
                <button>
                    <i className="fas fa-plus" />
                    <span>Create</span>
                </button>
            </form>
        );
    }
}
