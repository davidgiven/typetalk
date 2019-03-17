let ts = (window as any).ts;

let ttcontext: any = {
   __extends: (document as any).__extends,
   document: document,
   window: window
};

function updateClass(oldClass: any|null, newClass: any): any {
    if (oldClass != null) {
        Object.getOwnPropertyNames(newClass.prototype)
            .forEach(
                (methodName) => {
                    console.log(`patching ${methodName}`);
                    oldClass.prototype[methodName] = newClass.prototype[methodName];
                });

        newClass.prototype = oldClass.prototype;
    }
    return newClass;
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

    set(className: string, superclassName: string | null, source: string): void {
        let ttclass = this.resolve(className);
        ttclass.superclassName = superclassName;
        ttclass.typescript = source;
        ttclass.typescriptVersion++;
        ttclass.javascriptDirty = true;
        this.projectVersion++;
    }

    reloadJavascript(): void {
        let reloadRecursively = (ttclass: TTClass) => {
            if (!ttclass.javascriptDirty)
                return;
            if (ttclass.superclassName != null)
                reloadRecursively(this.resolve(ttclass.superclassName));
            console.log(`loading ${ttclass.className}`);

            let ctx = Object.create(ttcontext);
            let body = `
                with (this) {
                    ${ttclass.javascript}
                    return ${ttclass.className};
                }
            `
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

let compilationOptions = {
    target: ts.ScriptTarget.ES2015,
    strict: true,
    suppressOutputPathCheck: false,
    extendedDiagnostics: true,
    noEmitHelpers: true,
};

let languageServiceHost = new class LanguageServiceHost {
    private libraries = new Map<string, string>();

    private classOfFile(path: string): TTClass {
        return classRegistry.resolve(path.replace(/\.ts$/, ""));
    }

    addLibrary(path: string, contents: string) {
        this.libraries.set(path, contents);
    }

    getScriptFileNames(): string[] {
        return classRegistry.getAllClasses()
            .map(ttclass => `${ttclass.className}.ts`)
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

let languageServices = ts.createLanguageService(
    languageServiceHost,
    ts.createDocumentRegistry()
);

(function () {
    let scripts = document.getElementsByTagName("SCRIPT");
    for (let i = 0; i < scripts.length; i++) {
        let script = scripts[i];
        if (script.getAttribute("type") == "typescript-lib") {
            let leafName: string = (script as any).leafName;
            if (leafName.startsWith("lib.")) {
                languageServiceHost.addLibrary(leafName, (script as any).text);
            }
        }
    }
})();

classRegistry.set("Animal", null, `
class Animal {
    noise() { console.log("mu"); }
    move() { console.log("slither"); }
}
`);

classRegistry.set("Dog", "Animal", `
class Dog extends Animal {
    noise() { console.log("woof"); }
}
`);

classRegistry.set("Badger", "Animal", `
class Badger extends Animal {
    noise() { console.log("grunt"); }
}
`);

function recompile() {
    let errors = false;
    classRegistry.getAllClasses()
        .filter(ttclass => ttclass.javascriptDirty)
        .forEach(
            (ttclass) => {
                let filename = `${ttclass.className}.ts`;

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

    if (errors)
        console.log("compilation failed");
    else
        classRegistry.reloadJavascript();
}

recompile();

let a: any = new ttcontext.Dog();
a.noise();
a.move();

classRegistry.set("Dog", "Animal", `
class Dog extends Animal {
    noise() { console.log("LOUDER WOOF"); }
    move() { console.log("bounces"); }
}
`);
recompile();
a.noise();
a.move();
