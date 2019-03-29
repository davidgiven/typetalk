abstract class Runnable<PropsT> extends UiComponent<PropsT> {
    async run() {
        if (!this.root) {
            this.root = this.render(this.newJsxFactory(), this.props);
            document.body.appendChild(this.root);
        }
    }

    onClose() {
        if (this.root) {
            this.root.remove();
            this.root = undefined;
        }
    }
}
