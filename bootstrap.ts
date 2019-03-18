let ts = (window as any).ts;

let compilationOptions = {
    target: ts.ScriptTarget.ES2015,
    downlevelIteration: true,
    strict: true,
    suppressOutputPathCheck: false,
    extendedDiagnostics: true,
    noEmitHelpers: true,
    jsx: ts.JsxEmit.React,
    jsxFactory: "preact.h",
    noImplicitAny: false,
};

let ttcontext: any = {
    __extends: (document as any).__extends,
    document: document,
    window: window,
};

function updateClass(oldClass: any | null, newClass: any): any {
    if (oldClass == null) {
        return newClass;
    }

    Object.getOwnPropertyNames(newClass.prototype)
        .forEach(
            (methodName) => {
                console.log(`patching ${methodName}`);
                oldClass.prototype[methodName] = newClass.prototype[methodName];
            });

    return oldClass;
}

class TTClass {
    className: string;
    superclassName: string | null = null;
    typescript = "";
    typescriptVersion = 0;
    javascript = "";
    javascriptDirty = false;

    constructor(className: string) {
        this.className = className;
    }
};

let languageServiceHost: any;
let languageServices: any;

let classRegistry = new class {
    private classes = new Map<string, TTClass>();
    private projectVersion = 0;

    resolve(className: string): TTClass {
        let ttclass = this.classes.get(className);
        if (ttclass == undefined) {
            ttclass = new TTClass(className);
            this.classes.set(className, ttclass);
        }
        return ttclass;
    }

    getProjectVersion(): number {
        return this.projectVersion;
    }

    getAllClasses(): TTClass[] {
        return Array.from(this.classes.values());
    }

    getAllClassNames(): string[] {
        return Array.from(this.classes.keys());
    }

    get(className: string): [string | null | undefined, string | undefined] {
        if (!this.classes.has(className)) {
            return [undefined, undefined];
        }
        let ttclass = this.resolve(className);
        return [ttclass.superclassName, ttclass.typescript];
    }

    set(className: string, superclassName: string | null, source: string): void {
        let ttclass = this.resolve(className);
        ttclass.superclassName = superclassName;
        ttclass.typescript = source;
        ttclass.typescriptVersion++;
        ttclass.javascriptDirty = true;
        this.projectVersion++;
    }

    recompile() {
        let errors = false;
        classRegistry.getAllClasses()
            .filter(ttclass => ttclass.javascriptDirty)
            .forEach(
                (ttclass) => {
                    let filename = `${ttclass.className}.tsx`;

                    languageServices
                        .getCompilerOptionsDiagnostics()
                        .concat(languageServices.getSyntacticDiagnostics(filename))
                        .concat(languageServices.getSemanticDiagnostics(filename))
                        .forEach((d: any) => {
                            console.log(d.messageText);
                            errors = true;
                        });

                    let output = languageServices.getEmitOutput(filename);
                    if (!output.emitSkipped) {
                        for (let f of output.outputFiles) {
                            if (f.name !== `${ttclass.className}.js`)
                                throw `filename mismatch: got ${f.name}, expected ${filename}`;
                            ttclass.javascript = f.text;
                        }
                    }
                });

        if (errors) {
            console.log("compilation failed");
            return;
        }

        let reloadRecursively = (ttclass: TTClass) => {
            if (!ttclass.javascriptDirty)
                return;
            if (ttclass.superclassName != null)
                reloadRecursively(this.resolve(ttclass.superclassName));
            console.log(`loading ${ttclass.className}`);

            let ctx = Object.create(ttcontext);
            let body = `with (this) {\n\n${ttclass.javascript}\n\n` +
                `return ${ttclass.className}; }\n` +
                `//# sourceURL=${ttclass.className}.js`;
            let fn = new Function(body).bind(ctx);
            let createdClass = fn();

            ttcontext[ttclass.className] = updateClass(ttcontext[ttclass.className], createdClass);
            ttclass.javascriptDirty = false;
        };

        this.getAllClasses()
            .filter(ttclass => ttclass.javascriptDirty)
            .forEach(reloadRecursively);
    }
};

languageServiceHost = new class LanguageServiceHost {
    private libraries = new Map<string, string>();

    private classOfFile(path: string): TTClass {
        return classRegistry.resolve(path.replace(/\.tsx$/, ""));
    }

    addLibrary(path: string, contents: string) {
        this.libraries.set(path, contents);
    }

    getScriptFileNames(): string[] {
        return classRegistry.getAllClasses()
            .map(ttclass => `${ttclass.className}.tsx`)
            .concat(Array.from(this.libraries.keys()));
    }

    getScriptVersion(path: string): number {
        if (this.libraries.has(path))
            return 0;
        return this.classOfFile(path).typescriptVersion;
    }

    getProjectVersion(): number {
        return classRegistry.getProjectVersion();
    }

    getScriptSnapshot(path: string): string {
        let text = this.libraries.get(path);
        if (text == undefined)
            text = this.classOfFile(path).typescript;
        return ts.ScriptSnapshot.fromString(text);
    }

    getCurrentDirectory(): string {
        return "";
    }

    getCompilationSettings(): any {
        return compilationOptions;
    }

    getDefaultLibFileName(options: any): string {
        return "lib.d.ts";
    }

    readDirectory(path: string) {
        throw "readDirectory not supported";
    }

    trace = console.log;
};

languageServices = ts.createLanguageService(
    languageServiceHost,
    ts.createDocumentRegistry()
);

ttcontext.globals = ttcontext;
ttcontext.classRegistry = classRegistry;
(function () {
    let scripts = document.getElementsByTagName("SCRIPT");
    for (let i = 0; i < scripts.length; i++) {
        let script: any = scripts[i];
        switch (script.getAttribute("type")) {
            case "typetalk-lib":
                languageServiceHost.addLibrary(script.leafName, script.text);
                break;

            case "typetalk-src": {
                let matches = /(?:class|interface) (\w+)(?: +extends (\w+))?/.exec(script.text);
                if (!matches)
                    throw `script ${script.leafName} did not contain a parseable class`;
                let className = matches[1];
                let superclassName = matches[2] || null;
                classRegistry.set(className, superclassName, script.text);
            }
        }
    }
})();

classRegistry.recompile();
let browser = new ttcontext.Browser();
browser.start();
