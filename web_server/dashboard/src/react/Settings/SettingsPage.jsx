class SettingsPage extends React.Component {
    constructor(p) {
        super(p);

        this.state = {
            settings: null
        };
    }

    componentDidMount() {
        this.getAllSettings();
    }
    getAllSettings() {
        jsonFetch("/api/settings/get")
            .then(resp => {
                this.setState({ settings: resp });
            })
            .catch(err => {
                console.error(err);
            });
    }

    render() {
        let s = this.state;
        return (
            <>
                <h1>Settings</h1>
                <div className="list">
                    {s.settings &&
                        s.settings.map((setting, idx) => {
                            return (
                                <div className="flex-row item" key={idx}>
                                    <span>
                                        {setting.key}: {setting.value}
                                    </span>
                                </div>
                            );
                        })}
                </div>
            </>
        );
    }
}
