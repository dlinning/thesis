const DashboardPage = props => {
    return (
        <>
            <h1 id="page-title">{props.title}</h1>
            <div id={props.pageId} className="flex-col">{props.children}</div>
        </>
    );
};
