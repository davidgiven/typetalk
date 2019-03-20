abstract class Component {
    private parent: Element|undefined;
    private element: Element|undefined;

    getParent() {
        return this.parent;
    }

    getElement() {
        return this.element;
    }

    attachTo(parent: Element): this {
        if (this.parent) {
            if (this.element) {
                this.element.remove();
                this.element = undefined;
            }
            this.onDetached();
        }
        this.parent = parent;
        this.onAttached();
        this.redraw();
        return this;
    }

    redraw(): void {
        if (this.parent)
            this.element = preact.render(
                <div>
                    <p>({this.constructor.name})</p>
                    {this.render()}
                </div>,
                this.parent, this.element);
    }

    onAttached(): void {}
    onDetached(): void {}

    abstract render(): JSX.Element;
}
