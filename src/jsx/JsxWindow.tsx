class JsxWindow extends AbstractJsxComponent<JsxWindowProps, JsxWindowState> {
    private onMoveBegin(x: number, y: number) {
        let [winX, winY] = this.getPosition();
        this.state.startX = winX - x;
        this.state.startY = winY - y;
    }

    private onMoveDrag(x: number, y: number) {
        let newX = this.state.startX + x;
        let newY = this.state.startY + y;
        this.setPosition(newX, newY);
    }

    private onResizeBegin(x: number, y: number) {
        let [winX, winY] = this.getSize();
        this.state.startX = winX - x;
        this.state.startY = winY - y;
    }

    private onResizeDrag(x: number, y: number) {
        let props = this.props;
        let minW = props.minWidth || 128;
        let minH = props.minHeight || 128;

        let newW = this.state.startX + x;
        if (newW < minW)
            newW = minW;
        let newH = this.state.startY + y;
        if (newH < minH)
            newH = minH;
        this.setSize(newW, newH);
    }

    getMinimumSize(): [number, number] {
        return [128, 128];
    }
    
    render() {
        let props = this.props;
        return <JsxGrid className="window"
                rows="1.5em auto"
                template={["header", "content"]}>
                <JsxDraggable style={{"grid-area": "header"}}
                    onBegin={(x, y) => this.onMoveBegin(x, y)}
                    onMove={(x, y) => this.onMoveDrag(x, y)}
                    >
                    <div class="titlebar">
                        {props.title}
                    </div>
                </JsxDraggable>
                <div style={{"grid-area": "content", "display": "flex"}}>
                    {props.children}
                </div>
                { props.resizeable ?
                    <JsxDraggable
                        className="resizer"
                        onBegin={(x, y) => this.onResizeBegin(x, y)}
                        onMove={(x, y) => this.onResizeDrag(x, y)}
                        />
                    : undefined
                }
            </JsxGrid>;
    }
}
