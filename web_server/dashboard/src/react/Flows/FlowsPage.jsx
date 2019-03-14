class FlowsPage extends React.Component {
    constructor(p) {
        super(p);

        this.state = {};
    }

    openFlowEditor() {
        messenger.notify("OpenModal", {
            title: `Create New Flow`,
            content: <FlowEditor />
        });
    }

    render() {
        var s = this.state;
        return (
            <>
                <h1>Manage Flows</h1>
                <button onClick={this.openFlowEditor}>Create New Flow</button>
                <hr />
                <br />
                <FlowList standalone={true} />
            </>
        );
    }
}
