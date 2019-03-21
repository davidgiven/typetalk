class EditorComponent extends RunnableComponent {
    private textarea = document.createElement("textarea");
    private codemirror: CodeMirror.EditorFromTextArea|undefined;

    private afterCodemirrorAppend() {
        this.codemirror = CodeMirror.fromTextArea(this.textarea);
    }

    render() {
        return <JsxHBox>
            <JsxVBox>
                <div>Class list goes here</div>
                <div>Class controls go here</div>
            </JsxVBox>
            <JsxVBox>
                <JsxHtmlElement
                    child={this.textarea}
                    beforeAppend={() => {}}
                    afterAppend={() => this.afterCodemirrorAppend()}/>
                <div>Editor controls go here</div>
            </JsxVBox>
        </JsxHBox>;
    }

    name() {
        return "Editor";
    }

    run() {
        this.attachTo(document.body);
    }
}
