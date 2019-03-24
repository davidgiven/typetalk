class JsxGrid extends UiComponent<JsxGridProps> {
    render(jsx, props) {
        let style = {
            "display": "grid",
            "grid-template-columns": props.columns,
            "grid-template-rows": props.rows,
            ...props.style
        };
        if (props.template)
            style["grid-template-areas"] = props.template.map(s => `"${s}"`).join(" ");

        return <div class={props.class} style={style}>
            {props.children}
        </div>;
    }
}
