class HelloWorldRunnable extends Runnable<void> {
    private counter = 0;
    private editorElement?: HTMLTextAreaElement;

    name() {
        return "Click me";
    }

    render(jsx, props) {
        let source = classRegistry.get("HelloWorldRunnable")!.typescript;
        return <JsxWindow id="window" title="Hello world">
            <div>
                <div>
                    <p>Hello, there! I can do it {this.counter} times!</p>
                    <a href="#" onclick={() => this.countUp()}>[Up]</a>
                    <a href="#" onclick={() => this.countDown()}>[Down]</a>
                </div>
                <textarea ref={e => this.editorElement = e as HTMLTextAreaElement}>{source}</textarea>
                <button onclick={() => this.updateCode()}>Save</button>
            </div>
        </JsxWindow>
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
        if (this.editorElement != undefined) {
            let newSource = this.editorElement.value;
            classRegistry.set("HelloWorldRunnable", newSource);
            classRegistry.recompile();
        }
    }
}