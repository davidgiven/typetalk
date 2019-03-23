class EditorComponent extends RunnableComponent {
    private textarea = document.createElement("textarea");
    private codemirror: CodeMirror.EditorFromTextArea|undefined;

    constructor() {
        super();
        this.textarea.value = "This is some text.";
    }

    onSave() {
    }

    private afterCodemirrorAppend() {
        this.codemirror = CodeMirror.fromTextArea(this.textarea, {
            mode: "typescript",
            lineWrapping: true,
            tabSize: 4,
            indentWithTabs: false,
            lineNumbers: true,
        });
    }

    render() {
        return <JsxWindow title="Editor" resizeable={true} minWidth={300} minHeight={150}>
            <JsxGrid
                className="expand"
                columns="10em auto"
                rows="auto 1.5em"
                template={[
                    "classlist editor",
                    "classcontrols editorcontrols"
                ]}>
                <div style={{"grid-area": "classlist"}}>
                    Class list goes here
                </div>
                <JsxHtmlElement
                    style={{"grid-area": "editor"}}
                    className="editor-codecontainer"
                    child={this.textarea}
                    beforeAppend={() => {}}
                    afterAppend={() => this.afterCodemirrorAppend()}/>
                <div style={{"grid-area": "classcontrols"}}>
                    Class controls go here
                </div>
                <div style={{"grid-area": "editorcontrols"}}>
                    <button onClick={() => this.onSave()}>Save</button>
                </div>
            </JsxGrid>
        </JsxWindow>;
    }

    name() {
        return "Editor";
    }

    run() {
        this.attachTo(document.body);
    }
}
