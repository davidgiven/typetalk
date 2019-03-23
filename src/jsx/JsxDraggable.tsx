class JsxDraggable extends AbstractJsxComponent<JsxDraggableProps, JsxDraggableState> {
    private onMouseDown(me: MouseEvent) {
        me.preventDefault();
        if (this.props.onBegin)
            this.props.onBegin(me.clientX, me.clientY);
        document.onmousemove = me => this.onMouseMove(me);
        document.onmouseup = me => this.onMouseUp(me);
        return false;
    }

    private onMouseMove(me: MouseEvent) {
        me.preventDefault();
        if (this.props.onMove)
            this.props.onMove(me.clientX, me.clientY);
        return false;
    }

    private onMouseUp(me: MouseEvent) {
        this.onMouseMove(me);
        if (this.props.onEnd)
            this.props.onEnd(me.clientX, me.clientY);
        document.onmousemove = null;
        document.onmouseup = null;
        return false;
    }

    render() {
        return <div
                style={this.props.style}
                className={this.props.className}
                onMouseDown={me => this.onMouseDown(me)}>
            { this.props.children }
        </div>;
    }
};


