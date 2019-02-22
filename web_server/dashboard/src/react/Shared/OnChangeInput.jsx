class OnChangeInput extends React.Component {
    constructor(p) {
        super(p);

        this.initialValue = p.initialValue;

        this.updateTimer = null;

        this.state = {
            value: p.initialValue || ""
        };
        this.delay = this.props.delay || 300;
    }

    updateHandler(evt) {
        // Have to handle checboxes differently. What are "standards" anyways?
        var newValue = evt.target.type === "checkbox" ? (evt.target.checked === true ? "on" : "off") : evt.target.value || "";

        this.setState({ value: newValue });

        // Make it so updates are only sent every `this.delay` milliseconds,
        // after the user has stopped updating.
        clearTimeout(this.updateTimer);
        this.updateTimer = setTimeout(() => {
            this.props.callback(newValue);
        }, this.delay);
    }

    render() {
        let type = this.props.type ? this.props.type.toLowerCase() : "text";
        let props = {
            className: this.props.classes ? this.props.classes.join(" ") : "",
            onChange: this.updateHandler.bind(this),
            type: type,
            placeholder: this.props.placeholder || "",
            autoComplete: this.props.autocomplete || "off",
            name: this.props.name || ""
        };
        switch (type) {
            case "bool":
                props.type = "checkbox";
                props.checked = this.state.value === "on";
                break;
            default:
                props.value = this.state.value;
                break;
        }

        if (type === "textarea") {
            return <textarea {...props} />;
        }
        if (type === "select") {
            return <select {...props}>{this.props.options}</select>;
        }
        return <input {...props} />;
    }
}
