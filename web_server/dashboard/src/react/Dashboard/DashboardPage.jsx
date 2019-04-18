const DashboardPage = props => {
    return (
        <>
            <h1 id="page-title">{props.title}</h1>
            <main id={props.pageId} className="flex-col">{props.children}</main>
        </>
    );
};
