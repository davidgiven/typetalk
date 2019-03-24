class EditorRunnable extends Runnable<void> {
    name() {
        return "Editor";
    }

    render(jsx, props) {
        return <EditorComponent/>;
    }
}
