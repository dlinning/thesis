class Tile extends React.Component {
    render() {
        return (
            <>
                <h2>Tile</h2>
                <span>{JSON.stringify(this.props)}</span>
            </>
        );
    }
}
