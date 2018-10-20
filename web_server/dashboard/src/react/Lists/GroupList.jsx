class GroupList extends React.Component {
    render() {
        let groups = this.props.groups;
        if (groups === undefined || groups.list.length === 0) {
            return null;
        }

        return (
            <>
                {groups.list.length > 0 && (
                    <div className="list">
                        {groups.list.map((group, idx) => {
                            return (
                                <div className="item" key={idx}>
                                    {JSON.stringify(group)}
                                </div>
                            );
                        })}
                    </div>
                )}
                {groups.list.length === 0 && <p>You have no groups currently created.</p>}
            </>
        );
    }
}
