const DashboardControls = props => (
    <div className="dashboard-controls">
        <button onClick={props.saveFunc}>
            <i className="fas fa-save" />
            <span>Save View</span>
        </button>
    </div>
);
