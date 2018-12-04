class SettingsPage extends React.Component {
    constructor(p) {
        super(p);

        this.state = {
            allSettings: null,
            matches: [],
            searchTerm: undefined,
            error: null
        };
    }

    componentDidMount() {
        this.getAllSettings();
    }
    getAllSettings() {
        jsonFetch("/api/settings/get")
            .then(resp => {
                this.setState({ allSettings: resp, matches: resp });
            })
            .catch(err => {
                this.setState({ error: err });
                console.error(err);
            });
    }

    updateSetting(key, newValue) {
        if (newValue.length > 0) {
            // The change is already reflected client-side, so no change is necessary
            jsonFetch("/api/settings/set/" + key, { value: newValue }, "POST")
                .then(() => {
                    this.setState({ error: null });
                })
                .catch(err => {
                    this.setState({ error: err });
                    console.error(err);
                });
        }
    }

    searchTermUpdate(unfilteredTerm) {
        // We only want to search if the search term is
        // >= 2 characters
        if (unfilteredTerm.length < 2) {
            unfilteredTerm = undefined;
        }
        this.setState({ matches: this.filterSettingsBySearchTerm(unfilteredTerm) });
    }
    filterSettingsBySearchTerm(term) {
        // Short-circuit out
        if (term === undefined) {
            return this.state.allSettings;
        }

        // Do a simple match on all settings' `.key` for the search term.
        term = term.toLowerCase();
        let res = [];
        for (var n = 0, l = this.state.allSettings.length; n < l; n++) {
            if (this.state.allSettings[n].key.toLowerCase().indexOf(term) !== -1) {
                res.push(this.state.allSettings[n]);
            }
        }
        return res;
    }

    render() {
        let s = this.state;

        return (
            <>
                <h1>Settings</h1>
                <div className="flex-row">
                    <OnChangeInput
                        placeholder={"Search for a setting"}
                        type={"search"}
                        callback={this.searchTermUpdate.bind(this)}
                        delay={10}
                    />
                </div>
                <ErrorCard error={s.error} />
                <div className="list" id="settings-list">
                    {s.matches &&
                        s.matches.map(setting => {
                            return (
                                <div className="item flex-col" key={setting.key}>
                                    <div className="flex-row aic">
                                        <span className="s-name">{setting.key}:</span>
                                        <OnChangeInput
                                            initialValue={setting.value}
                                            callback={this.updateSetting.bind(this, setting.key)}
                                            type={setting.type}
                                        />
                                    </div>
                                    {setting.description && <p className="s-desc">{setting.description}</p>}
                                </div>
                            );
                        })}
                </div>
            </>
        );
    }
}
