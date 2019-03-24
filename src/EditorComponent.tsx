class EditorComponent extends UiComponent<any> {
    private textarea?: HTMLTextAreaElement;
    private codemirror?: CodeMirror.EditorFromTextArea;

    onSave() {
    }

    onRefresh() {
        this.refresh();
    }

    mount() {
        if (!this.textarea)
            return;

        console.log("mount");
        this.codemirror = CodeMirror.fromTextArea(this.textarea, {
            mode: "typescript",
            lineWrapping: true,
            tabSize: 4,
            indentWithTabs: false,
            lineNumbers: true,
        });
    }

    dismount() {
        if (this.codemirror)
            this.codemirror.toTextArea();
    }

    render(jsx, props) {
        return <JsxWindow
                id="window"
                title="Editor"
                resizeable={true}
                width="30em" height="10em"
                minWidth={300} minHeight={150}>
            <JsxGrid
                class="expand"
                columns="10em auto"
                rows="auto 1.5em"
                template={[
                    "classlist editor",
                    "controls editor"
                ]}>
                <div style={{"grid-area": "classlist"}}>
                    Class list goes here
                </div>
                <textarea ref={e => this.textarea = e} style={{"grid-area": "editor"}}/>
                <JsxHBox style={{"grid-area": "controls"}}>
                    <button onclick={() => this.onSave()}>Save</button>
                    <button onclick={() => this.onRefresh()}>Refresh</button>
                </JsxHBox>
            </JsxGrid>
        </JsxWindow>;
    }
}
