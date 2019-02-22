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
                this.setState({ allSettings: resp, matches: this.groupSettings(resp) });
            })
            .catch(err => {
                this.setState({ error: err });
                console.error(err);
            });
    }

    groupSettings(toGroup) {
        let res = {};

        toGroup.forEach(setting => {
            if (setting.inGroup) {
                if (res[setting.inGroup] == undefined) {
                    res[setting.inGroup] = [];
                }
                res[setting.inGroup].push(setting);
            } else {
                if (res["ungrouped"] == undefined) {
                    res["ungrouped"] = [];
                }
                res["ungrouped"].push(setting);
            }
        });
        return res;
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
        this.setState({ matches: this.groupSettings(this.filterSettingsBySearchTerm(unfilteredTerm)) });
    }
    filterSettingsBySearchTerm(term) {
        // Short-circuit out
        if (term === undefined) {
            return this.state.allSettings;
        }

        // Check each setting's `.key` or `.inGroup` to see if it should be shown
        term = term.toLowerCase();
        let res = [];
        for (var n = 0, l = this.state.allSettings.length; n < l; n++) {
            let setting = this.state.allSettings[n];
            if (
                this.state.allSettings[n].key.toLowerCase().indexOf(term) !== -1 ||
                (setting.inGroup && setting.inGroup.toLowerCase().indexOf(term) !== -1)
            ) {
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
                <div id="settings-filter-box" className="flex-row aic">
                    <i className="fas fa-search" />
                    <OnChangeInput
                        placeholder={"Search for a setting"}
                        type={"search"}
                        callback={this.searchTermUpdate.bind(this)}
                        delay={10}
                        autoComplete={false}
                        name="settingsSearch"
                    />
                </div>
                <ErrorCard error={s.error} />
                <div className="list constrain" id="settings-list">
                    {s.matches &&
                        Object.keys(s.matches).map(key => {
                            return (
                                <div className="tile settings-group" data-group-name={key} key={key}>
                                    <div className="title">{key}</div>
                                    {s.matches[key].map(setting => {
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
                            );
                        })}
                </div>
            </>
        );
    }
}
