class EditorComponent extends RunnableComponent {
    render() {
        return <div>
            <div>
                Class list goes here
            </div>
            <div>
                Editor goes here
            </div>
        </div>;
    }

    name() {
        return "Editor";
    }

    run() {
        this.attachTo(document.body);
    }
}
