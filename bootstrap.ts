let ts = (window as any).ts;

class VirtualFile {
    name: string;
    typescript: string;
    version: number = 0;
}

let compilationOptions = {
    target: ts.ScriptTarget.ES5,
    strict: true,
    suppressOutputPathCheck: false,
    extendedDiagnostics: true,
    noEmitHelpers: true,
};

let languageServiceHost = new class LanguageServiceHost {
    private files = new Map<string, VirtualFile>();
    private changedFiles = new Set<string>();
    private projectVersion = 0;

    getScriptFileNames(): string[] {
        return Array.from(this.files.keys());
    }

    getScriptVersion(path: string): number {
        let file = this.files.get(path);
        return (file == undefined) ? undefined : file.version;
    }

    getProjectVersion(): number {
        return this.projectVersion;
    }

    getScriptSnapshot(path: string): any {
        let data = this.readFile(path);
        return (data == undefined) ? undefined : ts.ScriptSnapshot.fromString(data);
    }

    readFile(path: string): string {
        let file = this.files.get(path);
        return (file == undefined) ? undefined : file.typescript;
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

    fileExists(path: string): boolean {
        return this.files.has(path);
    }

    readDirectory(path: string) {
        throw "readDirectory not supported";
    }

    resolveFile(path: string): VirtualFile {
        let file = this.files.get(path);
        if (file == undefined) {
            file = new VirtualFile();
            file.name = path;
            this.files.set(path, file);
            this.projectVersion++;
        }
        return file;
    }

    writeFile(path: string, contents: string) {
        console.log(`writing typescript ${path}`);

        let file = this.resolveFile(path);
        file.typescript = contents;
        file.version++;
        this.projectVersion++;

        this.changedFiles.add(path);
    }

    getChangedFiles(): Set<string> {
        let changed = this.changedFiles;
        this.changedFiles = new Set<string>();
        return changed;
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

let context = {
    __extends: __extends,
    document: document,
    window: window
};

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

function emitAll() {
    console.log("performing emit");
    languageServiceHost.getChangedFiles().forEach(
        (tsf) => {
            console.log("checking for errors");
            let diagnostics = languageServices
                .getCompilerOptionsDiagnostics()
                .concat(languageServices.getSyntacticDiagnostics(tsf))
                .concat(languageServices.getSemanticDiagnostics(tsf));
            diagnostics.forEach(d => {
                console.log(d.messageText);
            });
            if (diagnostics.length == 0) {
                let output = languageServices.getEmitOutput(tsf);
                if (!output.emitSkipped) {
                    for (let f of output.outputFiles) {
                        console.log(`name: ${f.name}`);
                        console.log(f.text);
                    }
                }
            }
        });
}
emitAll();

//languageServiceHost.writeFile("definition.ts", `
//enum SuperEnum { ONE, TWO, THREE };
//class Super {
//    m1() { console.log("frug"); }
//}
//`);
//emitAll();