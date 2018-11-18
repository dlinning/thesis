class Modal extends React.Component {
	constructor(p) {
		super(p);

		this.state = { open: false, content: null, title: null };

		messenger.subscribe("OpenModal", payload => {
			this.setState({
				open: true,
				content: payload.content,
				title: payload.title
			});
		});

		messenger.subscribe("CloseModal", () => {
			this.close();
		});
	}

	close() {
		this.setState({ open: false, content: null, title: null });
	}

	render() {
		let s = this.state;
		return (
			<div id="modal-scrim" className={s.open === true ? "open" : ""} onClick={() => this.close()}>
				<div id="modal" onClick={(e) => e.stopPropagation()}>
					<div className="controls">
						<span className="title">{s.title}</span>
						<button title="Close Modal" onClick={() => this.close()}>
							<i className="fas fa-times" />
						</button>
					</div>
					<div id="modal-content">{s.content}</div>
				</div>
			</div>
		);
	}
}
