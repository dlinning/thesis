class GroupsPage extends React.Component {
	constructor(p) {
		super(p);

		this.state = {};
	}

	render() {
		var s = this.state;
		return (
			<>
				<h1>Manage Groups</h1>
				<ErrorCard error={s.error} />
				<GroupList standalone={true} />
			</>
		);
	}
}
