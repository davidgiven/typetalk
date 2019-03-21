class JsxWindow extends preact.Component<JsxWindowProps, JsxWindowState> {
    private titlebar: Element|undefined;

    private static fromPixels(s: string|null): number {
        if (s)
            return +s.replace(/px$/, "");
        return 0;
    }

    private onBeginDrag(me: MouseEvent) {
        me.preventDefault();

        let computed = window.getComputedStyle(this.base.parentElement!);
        let winX = this.base.offsetLeft - JsxWindow.fromPixels(computed.borderLeftWidth);
        let winY = this.base.offsetTop - JsxWindow.fromPixels(computed.borderTopWidth);

        this.state.startX = winX - me.clientX;
        this.state.startY = winY - me.clientY;
        document.onmousemove = (me) => this.onDrag(me);
        document.onmouseup = (me) => this.onEndDrag(me);

        return false;
    }

    private onDrag(me: MouseEvent) {
        me.preventDefault();
        this.onMoveWindow(this.state.startX + me.clientX, this.state.startY + me.clientY);

        return false;
    }

    private onEndDrag(me: MouseEvent) {
        this.onDrag(me);
        document.onmousemove = null;
        document.onmouseup = null;

        return false;
    }

    private onBeginResize(me: MouseEvent) {
    }

    onMoveWindow(x: number, y: number) {
        this.base.style.left = `${x}px`;
        this.base.style.top = `${y}px`;
    }

    render() {
        let props = this.props;
        return <div class="window">
            <div class="titlebar"
                onMouseDown={(me) => this.onBeginDrag(me)}
                ref={e => this.titlebar = e}>
                {props.title}
            </div>
            <div class="content">
                {props.children}
            </div>
            { props.resizeable ?
            <div class="resizer" onMouseDown={me => this.onBeginResize(me)}/> : undefined }
        </div>;
    }
}
