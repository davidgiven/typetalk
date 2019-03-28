class JsxVBox extends UiComponent<JsxGridProps> {
    render(jsx, props) {
        let style = {
            "display": "grid",
            "grid-auto-flow": "row",
            "grid-auto-columns": "1fr",
            ...props.style
        };

        return <div class={props.class} style={style}>
            {props.children}
        </div>;
    }
}

