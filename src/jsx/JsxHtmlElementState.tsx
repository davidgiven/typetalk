class JsxHtmlElementState {
    id: string;
    hashId: string;

    constructor(id: string) {
        this.id = id;
        this.hashId = `#${id}`;
    }
}
