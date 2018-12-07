class DashboardTiles extends React.Component{

    // componentDidMount() {
    //     console.log('mount');
    //     this.showChildren();
    // }
    // componentDidUpdate() {
    //     console.log('update');
    //     this.showChildren();
    // }

    // showChildren() {
    //     console.log(this.props);
    // }
    

    render() {
        return <div id="tiles" className="dashboard-tiles">{this.props.children}</div>;
    }
}
