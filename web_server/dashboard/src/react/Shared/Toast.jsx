class Toast extends React.Component {
    constructor(p) {
        super(p);

        this.state = {
            msg: undefined,
            open: false,
            warn: false
        };
        this.timer = null;

        messenger.subscribe("OpenToast", d => {
            this.setState({ msg: d.message || d.msg }, () => {
                setTimeout(() => {
                    this.setState({ open: true, warn: d.warn || false });
                }, 10);
            });
            clearTimeout(this.timer);
            this.timer = setTimeout(() => {
                this.close();
            }, d.delay || 5000);
        });
        messenger.subscribe("CloseToast", () => {
            this.close();
        });
    }

    close() {
        this.setState({ open: false });
        clearTimeout(this.timer);
        setTimeout(() => {
            this.setState({ msg: undefined, warn: false });
        }, 550);
    }

    render() {
        let warnClass = this.state.warn ? "warn" : "";
        if (this.state.msg === undefined) {
            return null;
        }
        return (
            <div id="toast" className={`${this.state.open ? "open" : ""} ${warnClass}`}>
                <span dangerouslySetInnerHTML={{ __html: this.state.msg }} />
                <button id="toast-close" className={`round ${warnClass}`} onClick={this.close.bind(this)}>
                    <i className="fas fa-times" />
                </button>
            </div>
        );
    }
}
