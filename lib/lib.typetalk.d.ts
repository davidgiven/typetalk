declare const globals: any;

declare class TTClass {
    static addClass(name: string): TTClass;
    static getClass(name: string): TTClass|undefined;
    static getAllClasses(): Map<string, TTClass>;
    static recompile();

    getSource(): string;
    setSource(typescript: string);
}

declare class TypeTalk {
}

declare function nativeConstructor(theInstance: any, theClass: any, ...args: any);

