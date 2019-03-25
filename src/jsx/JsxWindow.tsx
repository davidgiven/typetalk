class JsxWindow extends UiComponent<JsxWindowProps> {
    private startX = 0;
    private startY = 0;

    private onMoveBegin(x: number, y: number) {
        let [winX, winY] = this.getPosition();
        this.startX = winX - x;
        this.startY = winY - y;
    }

    private onMoveDrag(x: number, y: number) {
        if (this.root) {
            this.root.style.left = `${this.startX + x}px`;
            this.root.style.top = `${this.startY + y}px`;
        }
    }

    private onResizeBegin(x: number, y: number) {
        let [winX, winY] = this.getSize();
        this.startX = winX - x;
        this.startY = winY - y;
    }

    private onResizeDrag(x: number, y: number) {
        let props = this.props;
        let minW = props.minWidth || 128;
        let minH = props.minHeight || 128;

        let newW = this.startX + x;
        if (newW < minW)
            newW = minW
        let newH = this.startY + y;
        if (newH < minH)
            newH = minH;

        if (this.root) {
            this.root.style.width = `${newW}px`;
            this.root.style.height = `${newH}px`;
        }
    }

    getMinimumSize(): [number, number] {
        return [128, 128];
    }

    render(jsx, props) {
        let style = {
            left: props.x,
            top: props.y,
            width: props.width,
            height: props.height,
            ...props.style
        };

        return <JsxGrid style={style} class="window"
            rows="1.5em auto"
            template={["header", "content"]}>
            <JsxDraggable style={{ "grid-area": "header" }}
                onBegin={(x, y) => this.onMoveBegin(x, y)}
                onMove={(x, y) => this.onMoveDrag(x, y)}
            >
                <div class="titlebar">
                    {props.title}
                </div>
            </JsxDraggable>
            <div style={{ "grid-area": "content", "display": "flex" }}>
                {props.children}
            </div>
            {props.resizeable &&
                <JsxDraggable
                    class="resizer"
                    onBegin={(x, y) => this.onResizeBegin(x, y)}
                    onMove={(x, y) => this.onResizeDrag(x, y)}
                />
            }
        </JsxGrid>;
    }
}
