class LogList extends React.Component {
    render() {
        let p = this.props;

        if (p.entries && p.entries.length > 0) {
            // Get all fields from the first key, will use later
            let fields = Object.keys(p.entries[0]);

            return (
                <DataTable canExport={true} exportTitle={p.exportTitle || p.title}>
                    {p.title && <span className="title">{p.title}</span>}
                    <div className="table">
                        <div className="tr header">
                            {fields.map((f, idx) => {
                                if (f == "SensorId" && p.hideSensorColumn === true) {
                                    return null;
                                } else {
                                    return (
                                        <div className="th" key={idx}>
                                            {f}
                                        </div>
                                    );
                                }
                            })}
                        </div>
                        {p.entries &&
                            p.entries.map((entry, idx) => {
                                let cells = fields.map((f, idx) => {
                                    // Handle special-case column
                                    if (f == "SensorId") {
                                        if (p.hideSensorColumn === true) {
                                            return null;
                                        }
                                        return (
                                            <div className="td" key={idx} title={entry[f]}>
                                                {entry[f].substring(0, 6)}
                                            </div>
                                        );
                                    } else if (f == "timestamp") {
                                        return (
                                            <div className="td" key={idx} title={entry[f]}>
                                                {new Date(entry.timestamp).concise()}
                                            </div>
                                        );
                                    }

                                    // Any other column
                                    return (
                                        <div className="td" key={idx}>
                                            {entry[f]}
                                        </div>
                                    );
                                });

                                return (
                                    <div className="tr" key={idx}>
                                        {cells}
                                    </div>
                                );
                            })}
                    </div>
                </DataTable>
            );
        }

        //TODO: Handle no entries being passed
        return null;
    }
}
