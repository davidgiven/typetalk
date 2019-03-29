class Browser extends Runnable<any> implements TTClassChangeListener {
    protected ids = new class {
        runnables?: JsxVBox;
    };
    private runnables = new Map<string, () => Runnable<any>>();

    static title() {
        return "Browser";
    }

    onClassesChanged() {
        let classes = TTClass.getAllClasses();

        let runnables = this.ids.runnables!.root!;
        while (runnables.lastChild)
            runnables.removeChild(runnables.lastChild);

        let jsx = this.newJsxFactory();
        for (let [className, ttclass] of classes) {
            if (ttclass && ttclass.prototype) {
                let proto = ttclass.prototype;
                if (proto instanceof Runnable) {
                    let title = (ttclass as any).title;
                    if (title) {
                        runnables.appendChild(
                            <button onclick={() => new (ttclass as any)().run()}>
                                {title()}
                            </button>
                        );
                    }
                }
            }
        }

        TTClass.subscribe(this);
    }

    render(jsx, props) {
        let children: Element[] = [];
        for (let [name, runnable] of this.runnables) {
            children.push(
                <button onclick={() => runnable().run()}>{name}</button>
            );
        }
        let ui = <JsxWindow title="Menu">
            <button onclick={() => this.onExport()}>Export</button>
            <JsxVBox id="runnables" />
        </JsxWindow>;
        this.onClassesChanged();
        return ui;
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
}
