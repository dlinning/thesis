class Tile extends React.Component {
    render() {
        let p = this.props;

        var tileStyle = {
            gridRowEnd: "span " + p.rowSpan,
            gridColumnEnd: "span " + p.colSpan
        };

        return (
            <div className="tile flex-col" style={tileStyle}>
                {this.props.children}
            </div>
        );
    }
}
