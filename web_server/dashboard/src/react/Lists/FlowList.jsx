class FlowList extends React.PureComponent {
	openFlowsPage() {
		messenger.notify("ChangePage", "flows");
	}

	render() {
		let p = this.props;

		return (
			<div className={p.standalone ? "flex-grid cols-3" : "flex-col"}>
				{!p.standalone && (
					<div className="flex-row aic sb title-row">
						<h2>Flows</h2>
						<button className="round" onClick={this.openFlowsPage.bind(this)}>
							<i className="fas fa-plus" />
						</button>
					</div>
				)}
				{p.flows &&
					p.flows.map(flow => {
						return (
							<div className="tile" key={`group_${flow.id}`}>
								<div className="title">{flow.name}</div>
								<div className="desc">
									<span title={flow.id}>({flow.id.substr(0, 6)})</span>
									{flow.description && <p>{flow.description}</p>}
								</div>
								<div className="content">
									<div className="data-module">
										<span className="value">{flow.activationCount}</span>
										<span className="label">Activation Count</span>
									</div>
									<div className="data-module">
										<button>Manage</button>
										<button className="warn overlay">Remove</button>
									</div>
								</div>
							</div>
						);
					})}
			</div>
		);
	}
}
