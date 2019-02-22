class FlowBuilder extends React.Component {
    constructor(p) {
        super(p);

        let fd = this.props.flowData || {};
        this.state = {
            id: fd.id,
            name: "Flow Name",
            description: "Flow Description",
            config: {}
        };
    }

    updateRootField(field, value) {
        let newState = {};
        newState[field] = value;
        this.setState(newState);
    }

    render() {
        var s = this.state;
        return (
            <div id="flow-builder" className="tile">
                <div className="title">New Flow</div>
                {this.props.flowData && <span>Created {'DATE'}</span>}
                <OnChangeInput
                    placeholder={this.state.name}
                    type={"text"}
                    callback={val => this.updateRootField("name", val)}
                    delay={0}
                    autoComplete={false}
                    name="flowName"
                />
                <OnChangeInput
                    placeholder={this.state.description}
                    type={"textarea"}
                    callback={val => this.updateRootField("description", val)}
                    delay={0}
                    autoComplete={false}
                    name="flowDesc"
                />
            </div>
        );
    }
}
