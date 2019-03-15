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

let src =`
class Fnord {
    floo() {
        console.log(7);
    }
}
`;

sys.writeFile("fnord.ts", src);

function reportDiagnostic(message: string) {
    console.log(`diagnostic: ${JSON.stringify(message)}`);
}

function reportWatchStatusChanged(message: string) {
    console.log(`watch status changed: ${JSON.stringify(message)}`);
}

const host = ts.createWatchCompilerHost(
    ["fnord.ts"],
    {
        target: ts.ScriptTarget.ES5,
    	strict: true,
    	suppressOutputPathCheck: false
    },
    sys,
    ts.createEmitAndSemanticDiagnosticsBuilderProgram,
    reportDiagnostic,
    reportWatchStatusChanged
);
host.writeFile = function(path: string, value: string) {
    console.log(`writing result program ${path} = ${value}`);
}

ts.createWatchProgram(host);
sys.writeFile("fnord.ts", src);
