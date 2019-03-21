class Browser extends Component {
    private runnables = new Map<string, RunnableComponent>();

    render() {
        let ui = <div></div>
        for (let [name, runnable] of this.runnables) {
            ui.children.push(
                <p><a href='#' onClick={() => runnable.run()}>{name}</a></p>
            );
        }
        return ui;
    }

    start(): void {
        console.log("Browser starting");
        this.findRunnables();
        this.redraw();
    }

    private findRunnables(): void {
        this.runnables.clear();
        /* This is hacky and horrible; ideally we should query the class registry
         * for this information. */
        for (let key of Object.getOwnPropertyNames(globals)) {
            let value = globals[key];
            if (value && value.prototype) {
                let proto = value.prototype;
                if (proto instanceof RunnableComponent) {
                    let runnable = new value();
                    this.runnables.set(runnable.name(), runnable);
                }
            }
        }
    }
}
