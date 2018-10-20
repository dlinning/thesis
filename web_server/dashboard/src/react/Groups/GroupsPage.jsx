class GroupsPage extends React.Component {
    constructor(p) {
        super(p);

        this.state = {};
    }

    componentDidMount() {
        fetch("/api/groups/list")
            .then(res => {
                return res.json();
            })
            .then(asJson => {
                this.setState({ groups: asJson });
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
