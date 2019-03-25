class Browser extends Runnable<any> {
    private runnables = new Map<string, () => Runnable<any>>();

    static title() {
        return "Browser";
    }

    run() {
        this.findRunnables();
        super.run();
    }

    render(jsx, props) {
        let children: Element[] = [];
        for (let [name, runnable] of this.runnables) {
            children.push(
                <p><a href='#' onclick={() => runnable().run()}>{name}</a></p>
            );
        }
        return <div>{ children }</div>
    }

    private findRunnables(): void {
        this.runnables.clear();
        /* This is hacky and horrible; ideally we should query the class registry
         * for this information. */
        for (let key of Object.getOwnPropertyNames(globals)) {
            let value = globals[key];
            if (value && value.prototype) {
                let proto = value.prototype;
                if ((proto instanceof Runnable) && value.title) {
                    this.runnables.set(value.title(), () => new value());
                }
            }
        }
    }
}
