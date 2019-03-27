abstract class Runnable<PropsT> extends UiComponent<PropsT> {
    async run() {
        if (!this.root) {
            this.root = this.render(this.newJsxFactory(), this.props);
            document.body.appendChild(this.root);
        }
    }
}
