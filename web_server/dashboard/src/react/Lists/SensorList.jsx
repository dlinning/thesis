class SensorList extends React.Component {
	openSensorSettingsModal(sensorId) {
		jsonFetch("/api/sensors/settings/" + sensorId)
			.then(resp => {
				resp.sensorId = sensorId;
				messenger.notify("OpenModal", {
					title: `Settings for Sensor ${sensorId.substr(0, 7)}`,
					content: (
						<SensorEditModal data={resp} allGroups={this.props.allGroups} />
					)
				});
			})
			.catch(err => {
				console.error(err);
			});
	}

	openSensorLogModal(sensorId) {
		console.log(sensorId);
		jsonFetch("/api/sensors/logs/" + sensorId)
			.then(resp => {
				messenger.notify("OpenModal", {
					title: `Logs For Sensor: ${sensorId.substr(0, 7)}...`,
					content: <LogList entries={resp} />
				});
			})
			.catch(err => {
				console.error(err);
			});
	}

	removeSensor(sensorId, deleteWithLogs = "") {
		jsonFetch(
			`/api/sensors/delete/${sensorId}/${deleteWithLogs}`,
			null,
			"DELETE"
		)
			.then(resp => {
				if (resp.sensor && resp.sensor.hasLogs) {
					// Verify the user wants to remove a sensor that has logged data
					var r = confirm(
						`Are you sure you want to delete sensor with ID:\n${sensorId}\nas it has logged data?\nNOTE: This will also delete the logged data.`
					);
					if (r == true) {
						// Force the remove
						this.removeSensor(sensorId, true);
					}
				} else {
					// Sensor was removed, either by previous prompt
					// or it never had logs in the first place
					this.props.sensorRemoveCallback();
				}
			})
			.catch(err => {
				console.error(err);
			});
	}

	//

	render() {
		let sensors = this.props.sensors;
		if (sensors === undefined) {
			return null;
		}

		return (
			<div className="flex-grid cols-3">
				{sensors.map(s => {
					return (
						<div className="tile" key={`sensor_${s.id}`}>
							<div className="title">{s.name}</div>
							<div className="desc">
								<span title={s.id}>({s.id.substr(0, 6)})</span>
								<span>{s.dataType}</span>
							</div>
							<div className="content">
								<div className="data-module">
									<span className="value">
										{s.logCount > 999000
											? "999k+"
											: Number(s.logCount).toLocaleString()}
									</span>
									<span className="label">Log Count</span>
								</div>
								<div className="data-module">
									<span className="value">{s.groups.length}</span>
									<span className="label">Groups</span>
								</div>
								<div className="data-module">
									<button>Manage</button>
									<button className="warn overlay">Remove</button>
								</div>
							</div>
						</div>
					);
				})}
				{sensors.length === 0 && (
					<p>
						You have no sensors currently registered. Please do so before
						viewing this page.
					</p>
				)}
			</div>
		);
	}
}
