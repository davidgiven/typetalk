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
            <JsxVBox>
                <button onclick={e => this.onImportButtonClicked()}>Import</button>
                <button onclick={() => this.onExport()}>Export</button>
            </JsxVBox>
            <JsxVBox id="runnables" />
        </JsxWindow>;
        this.onClassesChanged();
        return ui;
    }

    private async onImportButtonClicked() {
        var selector = document.createElement('input');
        selector.setAttribute('type', 'file');
        selector.onchange = e => this.onImport(e);
        selector.click();
    }

    private async onImport(e: Event) {
        let input = e.target as HTMLInputElement;
        let pd = await ProgressDialogue.run("Loading", 100);
        try {
            if (!input.files || (input.files.length != 1))
                throw "You must specify exactly one file to import";

            let data = await new Promise((resolve, reject) => {
                let reader = new FileReader();
                reader.onload = () => resolve(reader.result as ArrayBuffer)
                reader.onerror = reject;
                reader.readAsArrayBuffer(input.files![0]);
            });

            let jszip = globals.JSZip() as JSZip;
            await jszip.loadAsync(data, {});

            let files = new Array<JSZipObject>();
            jszip.forEach((name, file) => {
                if (name.match(/^[^/]*\.tsx$/)) {
                    files.push(file);
                }
            });

            for (let i = 0; i < files.length; i++) {
                let file = files[i];
                let ttclass = TTClass.addClass(file.name.replace(/\.tsx$/, ""));
                await pd.update(100 * i / files.length);
                let content = await file.async("string");
                ttclass.setSource(content);
            }
            await pd.update(100);
            TTClass.recompile();
        } finally {
            pd.close();
        }
    }

    private async onExport() {
        let jszip = globals.JSZip() as JSZip;
        let classes = TTClass.getAllClasses();
        let pd = await ProgressDialogue.run("Loading", 100);
        try {
            for (let [name, ttclass] of classes)
                jszip.file(`${name}.tsx`, ttclass.getSource());

            let data: Blob = await jszip.generateAsync(
                {
                    type: "blob",
                    compression: "DEFLATE",
                },
                progress => pd.update(progress)
            );
            await pd.update(100);
            globals.saveAs(data, "export.zip");
        } finally {
            pd.close();
        }
    }
}
