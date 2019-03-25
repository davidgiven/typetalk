class EditorComponent extends UiComponent<any> {
    protected ids = new class {
        textarea?: HTMLTextAreaElement;
        codemirror?: CodeMirror.EditorFromTextArea;
    }

    onSave() {
    }

    onRefresh() {
    }

    render(jsx, props) {
        let ui = <JsxWindow
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
                <div style={{ "grid-area": "classlist" }}>
                    Class list goes here
                </div>
                <div style={{ "grid-area": "editor", "position": "relative" }}>
                    <textarea id="textarea" style={{ "grid-area": "editor" }} />
                </div>
                <JsxHBox style={{ "grid-area": "controls" }}>
                    <button onclick={() => this.onSave()}>Save</button>
                    <button onclick={() => this.onRefresh()}>Refresh</button>
                </JsxHBox>
            </JsxGrid>
        </JsxWindow>;

        this.ids.codemirror = CodeMirror.fromTextArea(this.ids.textarea!, {
            mode: "typescript",
            lineWrapping: true,
            tabSize: 4,
            indentWithTabs: false,
            lineNumbers: true,
        });

        return ui;
    }
}
