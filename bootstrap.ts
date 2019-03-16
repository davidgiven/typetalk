let ts = (window as any).ts;

class VirtualFile {
    name: string;
    contents: string;
    version: number = 0;
}

class VirtualFileSystem {
    private files = new Map<string, VirtualFile>();
    private changedFiles = new Set<VirtualFile>();

    getFilenames(): Set<string> {
        return new Set(this.files.keys());
    }

    fileExists(path: string): boolean {
        return this.files.has(path);
    }

    readFile(path: string): string {
        let file = this.files.get(path);
        return (file == undefined) ? undefined : file.contents;
    }

    resolveFile(path: string): VirtualFile {
        let file = this.files.get(path);
        if (file == undefined) {
            file = new VirtualFile();
            file.name = path;
            this.files.set(path, file);
        }
        return file;
    }

    writeFile(path: string, contents: string) {
        let file = this.resolveFile(path);
        if (file.contents !== contents) {
            file.contents = contents;
            file.version++;
            this.changedFiles.add(file);
        }
    }

    getFileVersion(path: string): number {
        let file = this.resolveFile(path);
        return (file == undefined) ? undefined : file.version;
    }

    getChangedFiles(): Set<VirtualFile> {
        let changed = this.changedFiles;
        this.changedFiles = new Set<VirtualFile>();
        return changed;
    }

    resetChangedFiles(): void {
        this.changedFiles = new Set<VirtualFile>();
    }
}

let compilationOptions = {
    target: ts.ScriptTarget.ES5,
    strict: true,
    suppressOutputPathCheck: false,
    extendedDiagnostics: true,
    noEmitHelpers: true,
};

let languageServiceHost = new class LanguageServiceHost extends VirtualFileSystem {
    private vfs = new VirtualFileSystem();
    private projectVersion = 0;

    getScriptFileNames(): string[] {
        return Array.from(this.getFilenames());
    }

    getScriptVersion(path: string): number {
        return this.getFileVersion(path);
    }

    getProjectVersion(): number {
        return this.projectVersion;
    }

    getScriptSnapshot(path: string): any {
        let data = this.readFile(path);
        return (data == undefined) ? undefined : ts.ScriptSnapshot.fromString(data);
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

    writeFile(path: string, contents: string) {
        super.writeFile(path, contents);
        this.projectVersion++;
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
                languageServiceHost.writeFile(leafName, (script as any).text);
            }
        }
    }
})();

let compiledFiles = new VirtualFileSystem();

let context = {
    __extends: __extends,
    document: document,
    window: window
};

function reloadFile(file: VirtualFile) {
    console.log(`loading ${file.name}`);
    let ctx = Object.create(context);
    let f = new Function(file.contents).bind(context);
    f();
    for (let k in Object.keys(ctx)) {
        console.log(`found: ${k}`);
    }
}

function recompile() {
    let files = languageServiceHost.getChangedFiles();
    let errors = false;
    files.forEach(
        (file) => {
            let diagnostics = languageServices
                .getCompilerOptionsDiagnostics()
                .concat(languageServices.getSyntacticDiagnostics(file.name))
                .concat(languageServices.getSemanticDiagnostics(file.name));
            diagnostics.forEach(d => {
                console.log(d.messageText);
            });
            if (diagnostics.length == 0) {
                let output = languageServices.getEmitOutput(file.name);
                if (!output.emitSkipped) {
                    for (let f of output.outputFiles) {
                        compiledFiles.writeFile(f.name, f.text);
                    }
                }
            } else {
                errors = true;
            }
        });

    if (errors)
        console.log("compilation failed");
    else {
        languageServiceHost.resetChangedFiles();
        compiledFiles.getChangedFiles().forEach(reloadFile);
        compiledFiles.resetChangedFiles();
    }
}

languageServiceHost.writeFile("definition.ts", `
enum SuperEnum { ONE, THREE, TWO };
class Super {
    m1() { console.log("print"); }
};
`);
languageServiceHost.writeFile("dependent.ts", `
class Sub extends Super {
    m2() { console.log(SuperEnum.TWO); }
};

class Subber extends Sub {
    m1() { super.m1(); }
};
`);

recompile();

//languageServiceHost.writeFile("definition.ts", `
//enum SuperEnum { ONE, TWO, THREE };
//class Super {
//    m1() { console.log("frug"); }
//}
//`);
//emitAll();