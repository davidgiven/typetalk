class EditorRunnable extends Runnable<void> {
    static title() {
        return "Editor";
    }

    render(jsx, props) {
        return <JsxWindow
            title="Editor"
            resizeable={true}
            width="30em" height="10em"
            onClose={() => this.onClose()}
            minWidth={300} minHeight={150}>
            <EditorComponent />
        </JsxWindow>
    }
}
