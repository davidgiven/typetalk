declare const globals: any;

interface ClassRegistry {
    getAllClassNames(): string[];
    get(className: string): [string|null|undefined, string|undefined];
    set(className: string, superclassName: string | null, source: string): void;
    recompile();
}

declare const classRegistry: ClassRegistry;
