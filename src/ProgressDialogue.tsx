class ProgressDialogue extends UiComponent<any> {
    protected ids = new class {
        progress?: HTMLDivElement;
    };
    private title: string;
    private max: number;

    static async run(title, max) {
        let c = new ProgressDialogue(title, max);

        let jsx = c.newJsxFactory();
        c.root = c.render(jsx, {});
        document.body.appendChild(c.root!);
        await c.update(0);
        return c;
    }

    private constructor(title, max) {
        super({});
        this.title = title;
        this.max = max;
    }

    async update(progress: number) {
        let percent = `${100 * progress / this.max}%`;
        this.ids.progress!.style.width = percent;
    }

    async close() {
        if (this.root)
            this.root.remove();
    }

    render(jsx, props) {
        return <JsxWindow title="Progress" class="centred">
            <JsxVBox>
                <div style={{"text-align": "center"}}>{this.title}</div>
                <div style={{ width: "200px",  padding: "0.5em" }}>
                    <div id="progress" style={{ width: "0", height: "1em", "background-color": "blue" }}/>
                </div>
            </JsxVBox>
        </JsxWindow>
    }
}

