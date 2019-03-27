class RunTestsRunnable extends Runnable<any> {
    protected ids = new class {
        container?: HTMLElement;
    };

    static title() {
        return "Run all tests";
    }

    render(jsx, props) {
        return <div>
            <p><b>Running tests</b></p>
            <div id="container"/>
            </div>;
    }

    async run() {
        super.run();

        let jsx = this.newJsxFactory();
        for (let key of Object.getOwnPropertyNames(globals)) {
            let value = globals[key];
            if (value && value.prototype && (value.prototype instanceof AbstractTest)) {
                try {
                    new value().run();
                    this.ids.container!.appendChild(
                        <div><p>{value.name}: passed</p></div>
                    );
                } catch (e) {
                    this.ids.container!.appendChild(
                        <div><p>{value.name}: failed</p>
                        <pre>{e}</pre></div>
                    );
                }
            }
        }
    }
}
