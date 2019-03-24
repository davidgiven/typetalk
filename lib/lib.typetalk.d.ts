declare const globals: any;

interface TTClass {
    typescript: string;
    compiledClass: any;
}

interface ClassRegistry {
    getAllClassNames(): string[];
    get(className: string): TTClass|undefined;
    set(className: string, source: string): void;
    recompile();
}

declare function nativeConstructor(theInstance: any, theClass: any, ...args: any);

declare const classRegistry: ClassRegistry;
