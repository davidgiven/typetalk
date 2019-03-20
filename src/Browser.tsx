class Browser {
    private runnables = new Map<string, Runnable>();
    private element?: Element;

    start(): void {
        console.log("Browser starting");
        this.findRunnables();

        let ui = <div></div>
        for (let [name, runnable] of this.runnables) {
            ui.children.push(
                <p><a href='#' onClick={() => runnable.run()}>{name}</a></p>
            );
        }

        this.element = preact.render(ui, document.body, this.element);
    }

    private findRunnables(): void {
        this.runnables.clear();
        /* This is hacky and horrible; ideally we should query the class registry
         * for this information. */
        for (let key in globals) {
            let value = globals[key];
            if (value && value.prototype) {
                let proto = value.prototype;
                if (proto instanceof Runnable) {
                    let runnable = new value();
                    this.runnables.set(runnable.name(), runnable);
                }
            }
        }
    }
}
