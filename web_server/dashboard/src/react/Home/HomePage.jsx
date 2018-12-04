class HomePage extends React.Component {
    constructor(p) {
        super(p);

        this.state = {};
    }

    componentDidMount() {
        jsonFetch("/api/views/get/default")
            .then(res => {
                this.setState({ tiles: res.tiles, error: null });
            })
            .catch(err => {
                this.setState({ error: err });
                console.error(err);
            });
    }

    render() {
        var s = this.state;
        return (
            <>
                <h1>Home</h1>
                <ErrorCard error={s.error} />
                <DashboardTiles>
                    {s.tiles &&
                        s.tiles.map((t, idx) => {
                            var style = {
                                gridColumn: `${t.col} / span ${t.width}`,
                                gridRow: `${t.row} / span ${t.height}`
                            };
                            return (
                                <div className="tile" key={idx} style={style}>
                                    {JSON.stringify(t)}
                                </div>
                            );
                        })}
                </DashboardTiles>
            </>
        );
    }
}
