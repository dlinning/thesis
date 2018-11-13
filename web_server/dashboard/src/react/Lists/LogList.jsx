class LogList extends React.Component {
    dateFormat(timestamp) {
        var d = new Date(timestamp),
            month = "" + (d.getMonth() + 1),
            day = "" + d.getDate(),
            year = d.getFullYear();

        if (month.length < 2) month = "0" + month;
        if (day.length < 2) day = "0" + day;

        return [year, month, day].join("-");
    }

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
                            return (
                                <div className="tr" key={idx}>
                                    <div className="td">{entry.timestamp}</div>
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
