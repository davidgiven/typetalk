abstract class UiComponent<PropsT> {
    root?: HTMLComponentElement;
    protected ids: any = {};
    protected props: PropsT;

    constructor(props: PropsT) {
        this.props = props;
    }

    newJsxFactory() {
        let rootComponent = this;

        function jsxFactory<PropsST>(node: UiComponentConstructor<PropsST>, params: PropsST,
            ...children: (Element | string | undefined)[]);
        function jsxFactory(tag: string, params: HtmlAttributes,
            ...children: (Element | string | undefined)[]);
        function jsxFactory(kind: UiComponentConstructor<any> | string,
            params, ...children) {
            if (params == null)
                params = {};

            let e: HTMLComponentElement;
            if (typeof kind === "string") {
                e = document.createElement(kind) as HTMLElement;
                for (let key in params) {
                    let value = params[key];
                    if (key === "class")
                        key = "className";

                    if (typeof value === "object") {
                        if (key === "style") {
                            for (let k in value) {
                                let v = value[k];
                                if (v != undefined)
                                    e.style[k] = v;
                            }
                        } else
                            throw `can't use an object for a '${key}' parameter`;
                    } else if (value != undefined)
                        e[key] = value;
                }

                function recursivelyAddChildren(children: (Element | undefined | Element[])[]) {
                    for (let child of children) {
                        if (child === undefined)
                            continue;
                        else if (child.constructor === Array)
                            recursivelyAddChildren(child as Element[]);
                        else if (child instanceof Element)
                            e.appendChild(child);
                        else
                            e.appendChild(document.createTextNode(child.toString()));
                    }
                }

                recursivelyAddChildren(children);

                if (params.id)
                    rootComponent.ids[params.id] = e;
            } else {
                params.children = children;
                let componentConstructor = kind as UiComponentConstructor<any>;
                let subc = new componentConstructor(params);

                e = subc.render(subc.newJsxFactory(), params);
                subc.root = e;

                if (params.id)
                    rootComponent.ids[params.id] = subc;
            }

            return e;
        }

        return jsxFactory;
    }

    abstract render(jsx: {
        <PropsST>(node: UiComponentConstructor<PropsST>, params: PropsST,
            ...children: (Element | string | undefined)[]): HTMLComponentElement
        (tag: string, params: HtmlAttributes,
            ...children: (Element | string | undefined)[]): HTMLComponentElement
    }, props: PropsT): HTMLComponentElement;

    /* Miscellaneous utility methods */

    private static fromPixels(s: string | null): number {
        if (s)
            return +s.replace(/px$/, "");
        return 0;
    }

    getPosition(): [number, number] {
        if (!this.root)
            return [0, 0];
        let computed = window.getComputedStyle(this.root.parentElement!);
        let winX = this.root.offsetLeft - UiComponent.fromPixels(computed.borderLeftWidth);
        let winY = this.root.offsetTop - UiComponent.fromPixels(computed.borderTopWidth);
        return [winX, winY];
    }

    getSize(): [number, number] {
        if (!this.root)
            return [0, 0];
        return [this.root.clientWidth, this.root.clientHeight];
    }

    isAttached(): boolean {
        function is_attached(node) {
            if (node.nodeType === Node.DOCUMENT_NODE)
                return true;
            if (node.parentNode == undefined)
                return false;
            return is_attached(node.parentNode);
        }

        return is_attached(this.root);
    }
}
