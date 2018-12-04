class HomePage extends React.Component {
    constructor(p) {
        super(p);

        this.state = {};
    }

    componentDidMount() {
        this.getCurrentView(this.props.currentView);
    }
    componentWillReceiveProps(newP) {
        this.getCurrentView(newP.currentView);
    }

    getCurrentView(viewName) {
        jsonFetch("/api/views/get/" + viewName)
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
                <h1>Home {this.props.currentView === "default" ? "" : " | " + this.props.currentView}</h1>
                <ErrorCard error={s.error} />
                {s.tiles && s.tiles.length > 0 && (
                    <DashboardTiles>
                        {s.tiles.map((t, idx) => {
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
                )}
                {s.tiles && s.tiles.length === 0 && <h3>There are currently no tiles for this view.</h3>}
                <AddTileButton />
            </>
        );
    }
}

class AddTileButton extends React.Component {
    render() {
        return (
            <button id="home-addTileButton" onClick={() => alert("Opening Add Tile Modal")}>
                <i className="fas fa-plus" />
                <span>New Tile</span>
            </button>
        );
    }
}
