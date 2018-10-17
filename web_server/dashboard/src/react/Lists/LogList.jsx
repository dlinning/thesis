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
            <List>
                {p.title && <span className="title">{p.title}</span>}
                <div className="table">
                    <div className="tr">
                        <div class="th">Time</div>
                        <div class="th">Value</div>
                    </div>
                    {p.entries &&
                        p.entries.list.map((entry, idx) => {
                            let l = entry.value.length > 10;
                            return (
                                <div className="tr" key={idx}>
                                    <div className="td">{this.dateFormat(entry.timestamp)}</div>
                                    <div className="td" alt={l ? entry.value : ""}>
                                        {l ? entry.value.substr(0, 10) : entry.value}
                                    </div>
                                </div>
                            );
                        })}
                </div>
            </List>
        );
    }
}
