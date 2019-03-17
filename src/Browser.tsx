class Browser {
    private runnables = new Map<string, Runnable>();

    start(): void {
        console.log("Browser starting");
        this.findRunnables();
        for (let [name, runnable] of this.runnables) {
            console.log(name);
        }

        preact.render(<p>This is Preact!</p>, document.body, document.body.lastChild);
    }

    private findRunnables(): void {
        this.runnables.clear();
        for (let key in globals) {
            let value = globals[key];
            if (value && value.prototype && (value.prototype instanceof Runnable)) {
                let runnable = new value();
                this.runnables.set(runnable.name(), runnable);
            }
        }
    }
}
