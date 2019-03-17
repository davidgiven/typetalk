class HelloWorldRunnable extends Runnable {
    name() {
        return "Click me";
    }

    run() {
        let component = <p>Hello, world!</p>
        console.log("Hello, world!");
    }
}