class JsxDraggable extends UiComponent<JsxDraggableProps> {
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

    render(jsx, props) {
        return <div
                style={props.style}
                class={props.class}
                onmousedown={me => this.onMouseDown(me)}>
            { props.children }
        </div>;
    }
};

