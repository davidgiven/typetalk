declare const globals: any;

declare class TTClass {
    static addClass(name: string): TTClass;
    static getClass(name: string): TTClass|undefined;
    static getAllClasses(): Map<string, TTClass>;
    static recompile();

    static subscribe(subscriber: TTClassChangeListener);

    prototype: any;
    getSource(): string;
    setSource(typescript: string);
    getCommitted(): boolean;
    getErrors(): ReadonlyArray<ts.DiagnosticWithLocation>;
}

declare class TypeTalk {
}

declare interface TTClassChangeListener {
    onClassesChanged();
}

declare function nativeConstructor(theInstance: any, theClass: any, ...args: any);

