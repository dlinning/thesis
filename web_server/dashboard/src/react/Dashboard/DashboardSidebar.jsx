class DashboardSidebar extends React.Component {
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
                name: "flows",
                icon: "code-branch" // Chosen by @Thor#8916
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
            <aside id="dashboard-sidebar">
                <img src="./assets/logo.svg" alt="" id="logo"/>
                <ul>
                    {this.tabsMap.map(tab => {
                        return (
                            <li
                                key={tab.name}
                                className={this.props.currentPage === tab.name ? "selected" : ""}
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
