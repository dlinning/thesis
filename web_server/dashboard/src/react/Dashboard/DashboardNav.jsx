class DashboardNav extends React.Component {
    // Stateless, as it takes the currently selected page
    // via props from Dashboard component.

    constructor(p) {
        super(p);

        // An array of all pages to display.
        // Objects of {name: DISPLAY, icon: FA_ICON_SUFFIX}
        // `icon` property is used to display proper FontAwesome
        // icon, since name will likely be different
        this.tabsMap = [
            {
                name: "home",
                icon: "home"
            },
            {
                name: "sensors",
                icon: "broadcast-tower"
            },
            {
                name: "groups",
                icon: "layer-group"
            },
            {
                name: "settings",
                icon: "cog"
            }
        ];
    }

    render() {
        return (
            <aside className="dashboard-nav">
                <ul>
                    {this.tabsMap.map(tab => {
                        return (
                            <li
                                key={tab.name}
                                className={this.props.current === tab.name ? "selected" : ""}
                                onClick={() => this.props.pageChangeFunc(tab.name)}
                            >
                                <i className={"fas fa-" + tab.icon} />
                                <span>{tab.name}</span>
                            </li>
                        );
                    })}
                </ul>
            </aside>
        );
    }
}
