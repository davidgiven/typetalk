abstract class Runnable<PropsT> extends UiComponent<PropsT> {
    abstract name(): string;

    run() {
        if (!this.root) {
            this.root = document.createElement("DIV");
            document.body.appendChild(this.root);
            this.refresh();
        }
    }
}
