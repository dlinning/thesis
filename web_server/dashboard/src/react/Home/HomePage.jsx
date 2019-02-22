class HomePage extends React.PureComponent {

	render() {
		return (
			<>
				<h1>Home</h1>
				<div id="home-lists">
					<SensorList />
					<GroupList />
					<FlowList />
				</div>
			</>
		);
	}
}
