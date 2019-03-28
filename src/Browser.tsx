class Browser extends Runnable<any> {
    private runnables = new Map<string, () => Runnable<any>>();

    static title() {
        return "Browser";
    }

    async run() {
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
        return <div>
            <button onclick={() => this.onExport()}>Export</button>
            { children }</div>
    }

    private async onExport() {
        let jszip = globals.JSZip() as JSZip;
        let classes = TTClass.getAllClasses();
        for (let [name, ttclass] of classes)
            jszip.file(`${name}.tsx`, ttclass.getSource());
        
        let data: Blob = await jszip.generateAsync(
            {
                type: "blob",
                compression: "DEFLATE",
            }
        );
        globals.saveAs(data, "export.zip");
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
