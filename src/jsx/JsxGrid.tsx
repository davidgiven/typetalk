class JsxGrid extends AbstractJsxComponent<JsxGridProps, any> {
    render() {
        return <div class={this.props.className} style={
                {
                    "display": "grid",
                    "grid-template-columns": this.props.columns,
                    "grid-template-rows": this.props.rows,
                    "grid-template-areas": this.props.template!.map(s => `"${s}"`).join(" "),
                }
            }>
            {this.props.children}
            </div>;
    }
}
