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

declare const classRegistry: ClassRegistry;
