class HelloWorldRunnable extends Runnable {
    private element?: Element;
    private counter = 0;
    private editorElement?: HTMLTextAreaElement;

    name() {
        return "Click me";
    }

    run() {
        this.render();
    }

    countUp() {
        this.counter++;
        this.render();
    }

    countDown() {
        this.counter--;
        this.render();
    }

    updateCode() {
        if (this.editorElement != undefined) {
            let newSource = this.editorElement.value;
            classRegistry.set("HelloWorldRunnable", "Runnable", newSource);
            classRegistry.recompile();
        }
    }

    render() {
        let [superclassName, source] = classRegistry.get("HelloWorldRunnable");
        this.element = preact.render(
            <div>
                <div>
                    <p>Hello, there! I can do it {this.counter} times!</p>
                    <a href="#" onClick={() => this.countUp()}>[Up]</a>
                    <a href="#" onClick={() => this.countDown()}>[Down]</a>
                </div>
                <textarea ref={e => this.editorElement = e as HTMLTextAreaElement}>{source}</textarea>
                <button onClick={() => this.updateCode()}></button>
            </div>,
            document.body, this.element);
    }
}