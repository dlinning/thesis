class OnChangeInput extends React.Component {
    constructor(p) {
        super(p);

        this.initialValue = p.initialValue;

        this.updateTimer = null;

        this.state = {
            value: p.value || p.initialValue || ""
        };

        if (!p.value && p.type === "select" && p.placeholder) {
            this.state.value = "MUST_CHANGE";
        }

        this.delay = this.props.delay === undefined ? 300 : this.props.delay;
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (nextProps.value !== this.props.value || nextState.value !== this.state.value) {
            return true;
        }
        return false;
    }

    updateHandler(evt) {
        // Have to handle checkboxes differently. What are "standards" anyways?
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

        let classlist = this.props.classes || [];
        if (this.state.value == "MUST_CHANGE" && type == "select") {
            classlist.push("invalid");
        }

        let props = {
            className: classlist.join(" "),
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
            inputObj = (
                <select {...props}>
                    {this.props.placeholder && (
                        <option value="MUST_CHANGE" disabled hidden>
                            {this.props.placeholder}
                        </option>
                    )}
                    {this.props.options.map((val, idx) => {
                        // Quick-return if we provide
                        // display and "value" values
                        if (val.display && val.value) {
                            return (
                                <option value={val.value} key={val + "__" + idx}>
                                    {val.display}
                                </option>
                            );
                        }
                        // Otherwise assume `val` is both
                        // display and "value"
                        return (
                            <option value={val} key={val + "__" + idx}>
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
