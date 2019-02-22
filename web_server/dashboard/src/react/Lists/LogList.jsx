class LogList extends React.Component {
    render() {
        let p = this.props;
        return (
            <DataTable canExport={true}>
                {p.title && <span className="title">{p.title}</span>}
                <div className="table">
                    <div className="tr">
                        <div className="th">Time</div>
                        <div className="th">Value</div>
                    </div>
                    {p.entries &&
                        p.entries.map((entry, idx) => {
                            let l = entry.value.length > 10;
                            let formattedDate = new Date(entry.timestamp);
                            return (
                                <div className="tr" key={idx}>
                                    <div className="td">{formattedDate.toLocaleString()}</div>
                                    <div className="td" title={l ? entry.value : ""}>
                                        {l ? entry.value.substr(0, 10) : entry.value}
                                    </div>
                                </div>
                            );
                        })}
                </div>
            </DataTable>
        );
    }
}
