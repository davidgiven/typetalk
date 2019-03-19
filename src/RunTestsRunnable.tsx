class RunTestsRunnable extends Runnable {
    name() {
        return "Run all tests";
    }

    run() {
        let output = preact.render(
            <div>
                <p><b>Running tests</b></p>
            </div>,
            document.body);

        for (let key in globals) {
            let value = globals[key];
            if (value && value.prototype && (value.prototype instanceof AbstractTest)) {
                try {
                    new value().run();
                    preact.render(
                        <p>{value.name}: passed</p>,
                        output);
                } catch (e) {
                    preact.render(
                        <div>
                            <p>{value.name}: failed</p>
                            <pre>{e}</pre>
                        </div>,
                        output);
                }
            }
        }
    }
}
