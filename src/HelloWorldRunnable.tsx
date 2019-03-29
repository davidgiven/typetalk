class HelloWorldRunnable extends Runnable<void> {
    protected ids = new class {
        counter?: HTMLSpanElement;
        editor?: HTMLTextAreaElement;
    };
    private counter = 0;
    private ttclass = TTClass.getClass("HelloWorldRunnable")!;

    static title() {
        return "Click me";
    }

    render(jsx, props) {
        let ui = <JsxWindow
            title="Hello world"
            onClose={() => this.onClose()}>
            <div>
                <div>
                    <p>Hello, there! I can do it <span id="counter"/> times!</p>
                    <a href="#" onclick={() => this.countUp()}>[Up]</a>
                    <a href="#" onclick={() => this.countDown()}>[Down]</a>
                </div>
                <textarea id="editor">{this.ttclass.getSource()}</textarea>
                <button onclick={() => this.updateCode()}>Save</button>
            </div>
        </JsxWindow>
        this.refresh();
        return ui;
    }

    private refresh() {
        this.ids.counter!.textContent = this.counter.toString();
    }

    countUp() {
        this.counter++;
        this.refresh();
    }

    countDown() {
        this.counter--;
        this.refresh();
    }

    updateCode() {
        if (this.ids.editor != undefined) {
            let newSource = this.ids.editor.value;
            this.ttclass.setSource(newSource);
            TTClass.recompile();
        }
    }
}