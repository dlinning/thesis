class DataTable extends React.Component {
    constructor(p) {
        super(p);
        this.tableID = Math.random().toString().substring(3);
    }

    render() {
        return (
            <div className="datatable">
                {this.props.canExport === true && (
                    <div className="controls">
                        <button title="Export as .csv" onClick={() => this.export()}>
                            <span>Export as .CSV</span>
                        </button>
                    </div>
                )}
                <div id={`datatable_${this.tableID}`}>{this.props.children}</div>
            </div>
        );
    }

    export() {
        var el = document.getElementById(`datatable_${this.tableID}`);

        csvBuilder.build(el, this.props.exportTitle);
    }
}
