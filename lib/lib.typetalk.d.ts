declare const globals: any;

declare class TTClass {
    static addClass(name: string): TTClass;
    static getClass(name: string): TTClass|undefined;
    static getAllClasses(): Map<string, TTClass>;
    static recompile();

    static subscribe(subscriber: TTClassChangeListener);

    getSource(): string;
    setSource(typescript: string);
    getCommitted(): boolean;
}

declare class TypeTalk {
}

declare interface TTClassChangeListener {
    onClassesChanged();
}

declare function nativeConstructor(theInstance: any, theClass: any, ...args: any);

