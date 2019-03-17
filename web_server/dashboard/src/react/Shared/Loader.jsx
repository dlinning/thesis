const Loader = props => {
    return (
        <div className="ReactLoader">
            <i className="fas fa-spinner" />
            {props.children}
            {props.message && <span className="message">{props.message}</span>}
        </div>
    );
};
