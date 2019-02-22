class HomePage extends React.Component {
	constructor(p) {
		super(p);

		this.state = {};
	}

	componentDidMount() {
		Promise.all([jsonFetch("/api/sensors/list"), jsonFetch("/api/flows/list")])
			.then(res => {
				this.setState({ sensors: res[0], flows: res[1], error: null });
			})
			.catch(err => {
				this.setState({ error: err });
				console.error(err);
			});
	}

	render() {
		return (
			<>
				<h1>Home</h1>
				<div id="home-lists">
					<SensorList sensors={this.state.sensors} />
					<GroupList />
					<FlowList flows={this.state.flows} />
				</div>
			</>
		);
	}
}
