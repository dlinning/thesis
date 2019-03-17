class Modal extends React.Component {
    constructor(p) {
        super(p);

        this.state = { open: false, content: null, title: undefined };

        messenger.subscribe("OpenModal", payload => {
            this.setState({
                open: true,
                content: payload.content,
                title: payload.title || undefined
            });
        });

        messenger.subscribe("CloseModal", force => {
            this.close(force);
        });

        document.addEventListener("keyup", evt => {
            if (evt.keyCode == 27 && this.state.open) {
                this.close(true);
            }
        });
    }

    close(force = false) {
        if (force || confirm(`Are you sure to want to close the popup${this.state.title ? ` "${this.state.title}"` : ""}?`)) {
            this.setState({ open: false, content: null, title: undefined });
        }
    }

    render() {
        let s = this.state;
        return (
            <div id="modal-scrim" className={s.open === true ? "open" : ""}>
                <div id="modal" onClick={e => e.stopPropagation()}>
                    <div className="controls">
                        <span className="title">{s.title}</span>
                        <button title="Close Modal" onClick={() => this.close(true)}>
                            <i className="fas fa-times" />
                        </button>
                    </div>
                    <div id="modal-content">{s.content}</div>
                </div>
            </div>
        );
    }
}
