class OnChangeInput extends React.Component {
    constructor(p) {
        super(p);

        this.initialValue = p.initialValue;

        this.updateTimer = null;

        this.state = {
            value: p.initialValue || ""
        };
        this.delay = this.props.delay === undefined ? 300 : this.props.delay;
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
            type: type,
            placeholder: this.props.placeholder || (this.props.name && this.props.name.capitalize()) || "",
            autoComplete: this.props.autocomplete || "off",
            name: this.props.name || "",
            required: this.props.required ? true : false,
            disabled: this.props.disabled ? true : false
        };
        if (!this.props.submitText) {
            props.onChange = this.updateHandler.bind(this);
        }

        let inputObj = null;

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
            inputObj = <textarea {...props} />;
        } else if (type === "select") {
            props.value = this.props.placeholder;
            inputObj = (
                <select {...props}>
                    {this.props.options.map((val, idx) => {
                        // Quick-return if we provide
                        // display and "value" values
                        if (val.display && val.value) {
                            return (
                                <option value={val.value} key={idx}>
                                    {val.display}
                                </option>
                            );
                        }
                        // Otherwise assume `val` is both
                        // display and "value"
                        return (
                            <option value={val} key={idx}>
                                {val}
                            </option>
                        );
                    })}
                </select>
            );
        } else {
            inputObj = <input {...props} />;
        }

        return (
            <>
                {inputObj}
                {this.props.submitText && <button onClick={this.updateHandler.bind(this)}>{this.props.submitText}</button>}
            </>
        );
    }
}
