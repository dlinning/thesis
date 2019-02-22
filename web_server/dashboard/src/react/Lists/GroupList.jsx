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
		console.log("updating groups");
		jsonFetch("/api/groups/list")
			.then(resp => {
				console.log(resp);
				this.setState({ groups: resp, error: undefined });
			})
			.catch(err => {
				this.setState({ error: err });
				console.error(err);
			});
	}

	removeGroup(groupId, deleteWithSensors = "") {
		jsonFetch(
			`/api/groups/delete/${groupId}/${deleteWithSensors}`,
			null,
			"DELETE"
		)
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
			title: `Create Group`,
			content: <GroupAddForm groupAddCallback={this.updateGroups.bind(this)} />
		});
	}

	//

	render() {
		let groups = this.state.groups;
		if (groups === undefined || groups.length === 0) {
			return null;
		}

		return (
			<>
				{this.props.standalone && (
					<button onClick={this.openAddGroupModal.bind(this)}>
						Create Group
					</button>
				)}
				{groups.length > 0 && (
					<div
						className={this.props.standalone ? "flex-grid cols-4" : "flex-col"}
					>
						{!this.props.standalone && (
							<div className="flex-row aic sb title-row">
								<h2>Groups</h2>
								<button
									className="round"
									onClick={this.openAddGroupModal.bind(this)}
								>
									<i className="fas fa-plus" />
								</button>
							</div>
						)}
						{groups.map(group => {
							let g = group;
							return (
								<div className="tile" key={`group_${g.id}`}>
									<OnChangeInput
										initialValue={g.name}
										classes={["g-name"]}
										callback={newValue => {
											if (newValue.length > 0) {
												// No .then(), since the change is already reflected client-side
												jsonFetch(
													"/api/groups/createorupdate",
													{ groupName: newValue, uuid: g.id },
													"POST"
												).catch(err => {
													console.error(err);
												});
											}
										}}
									/>
									<div className="desc">
										<span title={g.id}>({g.id.substr(0, 6)})</span>
									</div>
									<div className="content">
										<div className="data-module">
											<span className="value">{g.sensorCount}</span>
											<span className="label">Sensors</span>
										</div>
										<div className="data-module">
											<button
												className="warn overlay"
												onClick={() => this.removeGroup(g.id)}
											>
												Remove
											</button>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				)}
				{groups.length === 0 && <p>There are no groups created.</p>}
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
					messenger.notify("CloseModal");
					this.props.groupAddCallback();
				} else {
					console.error("Error creating group:", resp);
				}
			})
			.catch(err => {
				console.error(err);
			});
	}
	render() {
		return (
			<form
				className="flex-col aic group-add-form"
				onSubmit={this.createGroup.bind(this)}
			>
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
