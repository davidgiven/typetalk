let ts = (window as any).ts;

enum FileWatcherEventKind {
    Created,
    Changed,
    Deleted
}

type FileWatcherCallback = (path: string, eventKind: FileWatcherEventKind) => void;

class FileWatcher {
    file: VirtualFile;
    callback: FileWatcherCallback;

    close(): void {
        this.file.watchers.delete(this);
    }
}

class VirtualFile {
    name: string;
    contents: string;
    watchers = new Set<FileWatcher>();
}

let sys = new class System {
    private files = new Map<String, VirtualFile>();

    getCurrentDirectory(): string {
        return "";
    }

    getExecutingFilePath(): string {
        return "";
    }

    fileExists(path): boolean { return this.files[path] != undefined; }

    readFile(path: string, encoding: string): string {
        console.log(`looking for ${path}`);
        let file = this.files[path];
        if (file == undefined) {
            return undefined;
        }

        return file.contents;
    }

    writeFile(path: string, contents: string) {
        console.log(`writing ${path}`);

        let file = this.files[path];
        if (file == undefined) {
            file = new VirtualFile();
            file.name = path;
            this.files[path] = file;
        }

        file.contents = contents;
        file.watchers.forEach((watcher) => {
            watcher.callback(path, FileWatcherEventKind.Changed)
        });
    }

    directoryExists(path: string): boolean {
        return false;
    }

    watchFile(path: string, callback, defaultPollingInterval): FileWatcher {
        console.log(`watching ${path}`);
        let file = this.files[path];
        if (file == undefined) {
            return undefined;
        }

        let watcher = new FileWatcher();
        watcher.file = file;
        watcher.callback = callback;
        file.watchers.add(watcher);
        return watcher;
    }

    setTimeout?(callback: (...args: any[]) => void, ms: number, ...args: any[]): any {
        return window.setTimeout(callback, ms, args);
    }

    clearTimeout?(timeoutId: any): void {
        window.clearTimeout(timeoutId);
    }

    getDefaultLibFileName(): string { return "lib.d.ts"; }
    useCaseSensitiveFileNames() { return false; }
    getCanonicalFileName(fileName) { return fileName; }
    getDirectories() { return []; }

    newLine = "\n";
};

(function(){
    let scripts = document.getElementsByTagName("SCRIPT");
    for (let i=0; i<scripts.length; i++) {
        let script = scripts[i];
        if (script.getAttribute("type") == "typescript-lib") {
            let leafName: string = (script as any).leafName;
            if (leafName.startsWith("lib.")) {
                sys.writeFile(leafName, (script as any).text;
            }
        }
    }
})();


sys.writeFile("fnord.ts", `
class Fnord {
    floo() {
        console.log(7);
    }
}
`);

function reportDiagnostic(diagnostic: any) {
    console.log(`diagnostic: ${diagnostic.messageText}`);
}

function reportWatchStatusChanged(message: string) {
    console.log(`watch status changed: ${JSON.stringify(message)}`);
}

const host = ts.createWatchCompilerHost(
    ["fnord.ts"],
    {
        target: ts.ScriptTarget.ES5,
    	strict: true,
        suppressOutputPathCheck: false,
        extendedDiagnostics: true,
    },
    sys,
    ts.createEmitAndSemanticDiagnosticsBuilderProgram,
    reportDiagnostic,
    reportWatchStatusChanged
);
host.writeFile = function(path: string, value: string) {
    console.log(`writing result program ${path} = ${value}`);
}
host.trace = console.log

ts.createWatchProgram(host);

sys.writeFile("fnord.ts", `
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
