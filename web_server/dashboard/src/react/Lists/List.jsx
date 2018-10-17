class List extends React.Component {
    constructor(p) {
        super(p);
        this.listID = Math.random();
    }

    render() {
        return (
            <div className="list flex-col">
                {this.props.children}
                <div className="controls">
                    <button onClick={() => this.export()}>Export as .csv</button>
                </div>
            </div>
        );
    }

    export() {
        console.log("Exporting list as csv", this.listID);
    }
}
