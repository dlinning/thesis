class HomePage extends React.Component {
	constructor(p) {
		super(p);

		this.state = {};
	}

	componentDidMount() {
		fetch("/api/sensors/list")
			.then(res => {
				return res.json();
			})
			.then(asJson => {
				this.setState({ sensors: asJson });
			})
			.catch(err => {
				console.error(err);
			});
	}

	render() {
		var s = this.state;
		return (
			<>
				<h1>Home</h1>
				<DashboardTiles>
					{s.sensors &&
						Object.keys(s.sensors).map((id, idx) => {
							return (
								<SensorTile
									rowSpan={3}
									colSpan={(idx + 2) % 3}
									key={idx}
									sensor={s.sensors[id]}
								/>
							);
						})}
				</DashboardTiles>
			</>
		);
	}
}
