class DataTable extends React.Component {
    constructor(p) {
        super(p);
        this.tableID = Math.random();
    }

    render() {
        return (
            <div className="datatable flex-col">
                <div id={`datatable_${this.tableID}`}>{this.props.children}</div>
                <div className="controls">
                    <button title="Export as .csv" onClick={() => this.export()}>
                        <i className="fas fa-file-export" />
                    </button>
                </div>
            </div>
        );
    }

    export() {
        console.log("Exporting table as csv", this.tableID);

        var el = document.getElementById(`datatable_${this.tableID}`);

        csvBuilder.build(el);
    }
}
