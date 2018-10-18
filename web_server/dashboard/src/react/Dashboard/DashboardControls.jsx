class DashboardControls extends React.Component {
    render() {
        return (
            <div className="dashboard-controls">
                <button onClick={this.props.saveFunc}>
                    <i className="fas fa-save" />
                    <span>Save View</span>
                </button>
            </div>
        );
    }
}
