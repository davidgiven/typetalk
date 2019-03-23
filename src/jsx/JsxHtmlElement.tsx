class JsxHtmlElement extends AbstractJsxComponent<JsxHtmlElementProps, JsxHtmlElementState> {
    private static globalId: number;

    constructor() {
        super();
        if (!JsxHtmlElement.globalId)
            JsxHtmlElement.globalId = 0;
        else
            JsxHtmlElement.globalId++;

        this.state = new JsxHtmlElementState(`JsxHtmlElement-${JsxHtmlElement.globalId}`);
    }

    componentDidMount() {
        let state = this.state;
        let props = this.props;
        if (props.child && document.querySelector(state.hashId)) {
            if (props.beforeAppend)
                props.beforeAppend();

            document.querySelector(state.hashId)!.appendChild(props.child);

            if (props.afterAppend)
                props.afterAppend();
        }
    }

    componentDidUpdate() {
        let state = this.state;
        let props = this.props;
        if (props.child && document.querySelector(state.hashId)) {
            if (props.beforeAppend)
                props.beforeAppend();

            document.querySelector(state.hashId)!.appendChild(props.child);

            if (props.afterAppend)
                props.afterAppend();
        }
    }

    componentWillReceiveProps(nextProps, nextState) {
        let state = this.state;
        let props = this.props;
        if (props.child && document.querySelector(state.hashId)) {
            document.querySelector(state.hashId)!.innerHTML = '';
        }
    }

    render() {
        return <div style={this.props.style} class={this.props.className} id={this.state.id}></div>;
    }
};
