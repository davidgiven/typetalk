class RunTestsRunnable extends Runnable<any> {
    private testResults = new Array<[string, string?]>();

    name() {
        return "Run all tests";
    }

    render(jsx, props) {
        return <div>
            <p><b>Running tests</b></p>
            { this.testResults.map(e =>
                <div><p>{e[0]}: {e[1] ? "failed" : "passed"}</p>
                {e[1] && <pre>{e[1]}</pre>}
                </div>
            )}
            </div>;
    }

    run() {
        for (let key of Object.getOwnPropertyNames(globals)) {
            let value = globals[key];
            if (value && value.prototype && (value.prototype instanceof AbstractTest)) {
                try {
                    new value().run();
                    this.testResults.push([value.name, undefined]);
                } catch (e) {
                    this.testResults.push(value.name, e.toString());
                }
            }
        }

        super.run();
    }
}
