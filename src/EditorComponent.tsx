class EditorComponent extends UiComponent<any> implements TTClassChangeListener {
    protected ids = new class {
        textarea?: HTMLTextAreaElement;
        codemirror?: CodeMirror.EditorFromTextArea;
        classlist?: HTMLSelectElement;
    };
    private currentClass?: TTClass;

    onClassesChanged() {
        let classes = TTClass.getAllClasses();
        let classNames = Array.from(classes.keys()).sort();
        let classlist = this.ids.classlist!;
        while (classlist.lastChild)
            classlist.removeChild(classlist.lastChild);

        let jsx = this.newJsxFactory();
        for (let className of classNames) {
            let ttclass = classes.get(className)!;
            classlist.appendChild(
                <option onclick={() => this.onClassSelected(ttclass)}>
                { ttclass.getCommitted() ? "" : "*" }
                {className}</option>
            );
        }

        TTClass.subscribe(this);
    }

    private flushDirtySource() {
        if (this.currentClass && this.ids.codemirror) {
            let src = this.ids.codemirror.getValue();
            this.currentClass.setSource(src);
        }
    }

    private onClassSelected(ttclass: TTClass) {
        this.flushDirtySource();

        this.currentClass = ttclass;
        let src = ttclass.getSource();
        let cm = this.ids.codemirror!;
        cm.setValue(src);

        let jsx = this.newJsxFactory();
        for (let e of ttclass.getErrors()) {
            let pos = e.file!.getLineAndCharacterOfPosition(e.start!);
            let text = ts.flattenDiagnosticMessageText(e.messageText, "\n");
            cm.addLineWidget(pos.line, <pre class="CodeMirror-error">{text}</pre>);
        }
    }

    private onCommit() {
        this.flushDirtySource();
        TTClass.recompile();
        this.onClassSelected(this.currentClass!);
    }

    private async onNewClass() {
        let className = await QueryDialogue.run("New class name",
            "What do you want to call your new class?");
        if (!className)
            return;

        this.onClassSelected(TTClass.addClass(className));
    }

    render(jsx, props) {
        let ui = <JsxGrid
                class="expand"
                columns="15em auto"
                rows="auto 1.5em"
                template={[
                    "classlist editor",
                    "controls editor"
                ]}>
                <select id="classlist" style={{ "grid-area": "classlist" }} size="3">
                    <option value="item">Item</option>
                </select>
                <div style={{ "grid-area": "editor", "position": "relative" }}>
                    <textarea id="textarea" style={{ "grid-area": "editor" }} />
                </div>
                <JsxHBox style={{ "grid-area": "controls" }}>
                    <button onclick={() => this.onNewClass()}>New</button>
                    <button onclick={() => this.onCommit()}>Commit</button>
                </JsxHBox>
            </JsxGrid>;

        this.ids.codemirror = CodeMirror.fromTextArea(this.ids.textarea!, {
            mode: "javascript",
            lineWrapping: true,
            tabSize: 4,
            indentWithTabs: false,
            lineNumbers: true,
        });

        this.onClassesChanged();
        return ui;
    }
}
