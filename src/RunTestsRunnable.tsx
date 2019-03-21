class RunTestsRunnable extends RunnableComponent {
    private output = <div>
        <p><b>Running tests</b></p>
    </div>;

    name() {
        return "Run all tests";
    }

    render() {
        return this.output;
    }

    run() {
        this.attachTo(document.body);
        for (let key of Object.getOwnPropertyNames(globals)) {
            let value = globals[key];
            if (value && value.prototype && (value.prototype instanceof AbstractTest)) {
                try {
                    new value().run();
                    this.output.children.push(
                        <p>{value.name}: passed</p>
                    );
                } catch (e) {
                    this.output.children.push(
                        <div>
                            <p>{value.name}: failed</p>
                            <pre>{e}</pre>
                        </div>
                    );
                }
            }
        }
        this.redraw();
    }
}
