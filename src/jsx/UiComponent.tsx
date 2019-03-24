abstract class UiComponent<PropsT> {
    private subcomponents = new Map<string, UiComponent<any>>();
    protected root?: HTMLComponentElement;
    protected props: PropsT;

    jsxFactory<PropsST>(node: UiComponentConstructor<PropsST>, params: PropsST,
        ...children: (Element | string | undefined)[]);
    jsxFactory(tag: string, params: HtmlAttributes,
        ...children: (Element | string | undefined)[]);
    jsxFactory(kind, params, ...children) {
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
        } else {
            params.children = children;
            let componentConstructor = kind as UiComponentConstructor<any>;
            let subc: UiComponent<any> | undefined;
            /* Check the registry to see if this subcomponent exists. */
            if (params.id)
                subc = this.subcomponents.get(params.id);
            if (subc)
                subc.props = params;
            else {
                /* The subcomponent isn't in the registry, so make a new one. */
                subc = new componentConstructor(params);
                if (params.id)
                    this.subcomponents.set(params.id, subc);
            }

            e = this.renderSubcomponent(subc);
        }

        return e;
    }

    private static copyState(fromElement: HTMLComponentElement,
        toElement: HTMLComponentElement): boolean {
        for (let event in toElement) {
            if (toElement[event] && event.startsWith("on")) {
                fromElement[event] = toElement[event];
            }
        }

        fromElement.component = toElement.component;
        return true;
    }

    static replaceUi(dest: Element, src: Element) {
        morphdom(dest, src, {
            onBeforeElUpdated: UiComponent.copyState,
        });
    }

    constructor(props: PropsT) {
        this.props = props;
    }

    mount() { }
    dismount() { }

    refresh() {
        let root = this.root;
        if (root) {
            let tw = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, null, false);
            for (;;) {
                let e = tw.currentNode as HTMLComponentElement;
                if (e.component) {
                    for (let subc of e.component) {
                        if (subc.root) {
                            subc.dismount();
                            subc.root = undefined;
                        }
                    }
                }
                if (!tw.nextNode())
                    break;
            }

            let replacement = this.renderSubcomponent(this);
            UiComponent.replaceUi(root, replacement);

            tw = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, null, false);
            for (;;) {
                let e = tw.currentNode as HTMLComponentElement;
                if (e.ref)
                    e.ref(e);
                if (!tw.nextNode())
                    break;
            }

            tw = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, null, false);
            for (;;) {
                let e = tw.currentNode as HTMLComponentElement;
                if (e.component) {
                    for (let subc of e.component) {
                        subc.root = e;
                        subc.mount();
                    }
                }
                if (!tw.nextNode())
                    break;
            }
        }
    }

    private renderSubcomponent(subc: UiComponent<any>): HTMLComponentElement {
        let e = subc.render(
            (kind, params, ...children) => this.jsxFactory(kind, params, ...children),
            subc.props);

        if (e.component == undefined)
            e.component = new Set<UiComponent<any>>();
        e.component.add(subc);
        return e;
    }

    abstract render(jsx: any, props: PropsT): HTMLComponentElement;

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
}
