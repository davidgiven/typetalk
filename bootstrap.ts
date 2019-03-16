let ts = (window as any).ts;

class VirtualFile {
    name: string;
    contents: string;
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
        return (file == undefined) ? undefined : file.contents;
    }

    getCurrentDirectory(): string {
        return "";
    }

    getCompilationSettings(): any {
        return compilationOptions;
    }

    getDefaultLibFileName(options: any): string {
        return "lib.ts.d";
    }

    fileExists(path: string): boolean {
        return this.files.has(path);
    }

    readDirectory(path: string) {
        throw "readDirectory not supported";
    }

    writeFile(path: string, contents: string) {
        console.log(`writing ${path}`);

        let file = this.files.get(path);
        if (file == undefined) {
            file = new VirtualFile();
            file.name = path;
            this.files.set(path, file);
            this.projectVersion++;
        }

        file.contents = contents;
        file.version++;
        this.projectVersion++;
    }

    trace = console.log;
};

let languageServices = ts.createLanguageService(
    languageServiceHost,
    ts.createDocumentRegistry()
);

languageServiceHost.writeFile("blah.ts", `
class Bling {
}
`);
languageServiceHost.writeFile("fnord.ts", `
class Fnord {
    floo() {
        console.log(7);
    }

    bar() {
    }
}

class Blah extends Fnord {
    floo() {
        super.floo();
    }
}

`);

function emitAll() {
    for (let tsf of languageServiceHost.getScriptFileNames()) {
        let output = languageServices.getEmitOutput(tsf);
        if (!output.emitSkipped) {
            for (let f of output.outputFiles) {
                console.log(`name: ${f.name}`);
                console.log(f.text);
            }
        }
    }
}
emitAll();

languageServiceHost.writeFile("blah.ts", `
class Bling {
    mnmnmn() {}
}
`);
emitAll();