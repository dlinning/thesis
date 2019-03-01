// From
// https://techblog.commercetools.com/seven-patterns-by-example-the-many-ways-to-type-radio-in-react-bfe14322bb6f

const RadioGroup = props => {
    return (
        <div className="radio-group">
            {props.children.map(child => {
                if (child.type === RadioOption) {
                    return React.cloneElement(child, {
                        checked: props.value === child.props.value,
                        name: props.name,
                        onChange: props.handleChange
                    });
                }
                return child;
            })}
        </div>
    );
};

const RadioOption = props => {
    return (
        <label className={`radio-line ${props.checked ? "selected" : ""}`}>
            <input type="radio" name={props.name} onChange={() => props.onChange(props.value)} checked={props.checked} />
            <span>{props.children}</span>
        </label>
    );
};
