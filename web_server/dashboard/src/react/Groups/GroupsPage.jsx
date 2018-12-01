class GroupsPage extends React.Component {
    constructor(p) {
        super(p);

        this.state = {};
    }

    componentDidMount() {
        jsonFetch("/api/groups/list").then(resp => {
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
                <GroupList groups={s.groups} />
            </>
        );
    }
}
