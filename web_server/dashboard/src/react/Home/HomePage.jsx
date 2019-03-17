const HomePage = props => {
    return (
        <>
            <h1>Home</h1>
            <div id="home-lists">
                <FlowList />
                <SensorList />
                <GroupList />
            </div>
        </>
    );
};
