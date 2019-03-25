class EditorRunnable extends Runnable<void> {
    static title() {
        return "Editor";
    }

    render(jsx, props) {
        return <EditorComponent/>;
    }
}
