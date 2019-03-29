class QueryDialogue extends UiComponent<any> {
    protected ids = new class {
        text?: HTMLInputElement;
    };
    private title: string;
    private question: string;
    private onresult: (result: string|null) => void;

    static run(title, question): Promise<string|null> {
        return new Promise(
            (resolve, reject) => {
                let c = new QueryDialogue(title, question,
                    (result) => {
                        resolve(result);
                        c.root!.remove();
                    }
                );
                let jsx = c.newJsxFactory();
                c.root = c.render(jsx, {});
                document.body.appendChild(c.root!);
            }
        );
    }

    constructor(title, question, onresult) {
        super({});
        this.title = title;
        this.question = question;
        this.onresult = onresult
    }

    private onCancel() {
        this.onresult(null);
    }

    private onConfirm() {
        this.onresult(this.ids.text!.value);
    }

    render(jsx, props) {
        return <JsxWindow title={this.title}
            onClose={() => this.onCancel()}>
            <JsxVBox>
                <div style={{ "max-width": "30em"}}>{this.question}</div>
                <input id="text" type="text"></input>
                <JsxHBox>
                    <button onclick={() => this.onCancel()}>Cancel</button>
                    <button onclick={() => this.onConfirm()}>Confirm</button>
                </JsxHBox>
            </JsxVBox>
        </JsxWindow>
    }
}
