declare namespace ts {
    function createDiagnosticForNodeInSourceFile(
        sourceFile: SourceFile,
        node: Node,
        message: DiagnosticMessage,
        arg0?: string | number,
        arg1?: string | number,
        arg2?: string | number,
        arg3?: string | number): DiagnosticWithLocation;
}

let compilerOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2017,
    downlevelIteration: true,
    strict: true,
    suppressOutputPathCheck: false,
    extendedDiagnostics: true,
    jsx: ts.JsxEmit.React,
    jsxFactory: "jsx",
    noImplicitAny: false,
};

let languageServiceHost;
let languageService;
let id = 0;

let ttcontext: any = {};
Object.setPrototypeOf(ttcontext, window);

(Object as any).prototype.__constructor = (...args) => { };

ttcontext.TTObject = class TTObject {
    constructor(...args) {
        (this as any).__constructor(...args);
    }
};

ttcontext.nativeConstructor = (theInstance: any, theClass: any, ...args: any) => {
    theClass.prototype.constructor.bind(theInstance)(...args);
};

function createClass(name: string) {
    let fn = new Function(`
        return function ${name}(...args) {
            this.__constructor(...args);
        };
        `)();
    id++;
    Object.defineProperty(fn, "__id", { enumerable: false, value: id });
    Object.defineProperty(fn.prototype, "__id", { enumerable: false, value: id });
    return fn;
}

let TTClassImpl = ttcontext.TTClass = createClass("TTClass");
Object.setPrototypeOf(TTClassImpl, TTClassImpl.prototype);
let typetalk = ttcontext.TypeTalk = createClass("TypeTalk");
Object.setPrototypeOf(typetalk, TTClassImpl.prototype);
let classes = new Map<string, any>();

let projectVersion = 0;
TTClassImpl.prototype._typescript = "";
TTClassImpl.prototype._typescriptVersion = 0;
TTClassImpl.prototype._javascript = "";
TTClassImpl.prototype._javascriptDirty = true;
TTClassImpl.prototype._errors = [];

TTClassImpl.prototype.setSource = function (typescript) {
    if (this._typescript != typescript) {
        this._typescript = typescript;
        this._typescriptVersion++;
        this._javascriptDirty = true;
        this._errors = [];
        projectVersion++;
        fireSubscribers();
    }
}

TTClassImpl.prototype.getSource = function () {
    return this._typescript;
}

TTClassImpl.prototype.getCommitted = function () {
    return !this._javascriptDirty;
}

TTClassImpl.prototype.getErrors = function () {
    return this._errors;
}

let subscribers = new Set<TTClassChangeListener>();
function fireSubscribers() {
    for (let subscriber of subscribers)
        setTimeout(() => subscriber.onClassesChanged(), 0);
    subscribers.clear();
}

TTClassImpl.subscribe = function (subscriber) {
    subscribers.add(subscriber);
}

TTClassImpl.addClass = function (name) {
    let ttclass = classes.get(name);
    if (!ttclass) {
        ttclass = createClass(name);
        Object.setPrototypeOf(ttclass, TTClassImpl.prototype);
        classes.set(name, ttclass);
        ttcontext[name] = ttclass;
        fireSubscribers();
    }
    return ttclass;
}

TTClassImpl.getClass = function (name) {
    return classes.get(name);
}

TTClassImpl.getAllClasses = function () {
    return classes;
}

TTClassImpl.recompile = function () {
    let errors = false;

    /* Phase 1: clear pending diagnostics. */

    for (let ttclass of classes.values())
        ttclass._errors = [];

    /* Phase 2: accumulate all diagnostics. */

    let diagnostics: ts.DiagnosticWithLocation[] = [];
    for (let ttclass of classes.values()) {
        let filename = `${ttclass.name}.tsx`;
        diagnostics = diagnostics.concat(
            languageService
                .getCompilerOptionsDiagnostics()
                .concat(languageService.getSyntacticDiagnostics(filename))
                .concat(languageService.getSemanticDiagnostics(filename))
                .filter(d => d.file && d.start));
    }

    /* Phase 3: attach the diagnostics to the files. */

    for (let d of diagnostics) {
        let classname = d.file.fileName.replace(/\.tsx$/, "");
        let ttclass = classes.get(classname);
        console.log(`${d.file.fileName}:${d.start} ${ts.flattenDiagnosticMessageText(d.messageText, "\n")}`);
        if (ttclass) {
            ttclass._errors.push(d);
        }
    }

    /* Phase 4: emit Javascript, even if we had diagnostics. This may add more diagnostics. */

    for (let ttclass of classes.values()) {
        if (!ttclass._javascriptDirty)
            continue;

        let filename = `${ttclass.name}.tsx`;
        console.log(`compiling ${ttclass.name}`);

        let output = languageService.getEmitOutput(filename);
        if (!output.emitSkipped) {
            for (let f of output.outputFiles) {
                if (f.name !== `${ttclass.name}.js`)
                    throw `filename mismatch: got ${f.name}, expected ${filename}`;
                ttclass._javascript = f.text;
            }
        }
    }

    /* Phase 5: check all classes for diagnostics. If found, stop now. */

    let diagnostics_found = false;
    for (let ttclass of classes.values()) {
        if (ttclass._errors.length > 0) {
            diagnostics_found = true;
            break;
        }
    }
    if (diagnostics_found) {
        console.log("Compilation failed.");
        return;
    }

    /* Phase 6: reload the Javascript. */

    for (let ttclass of classes.values()) {
        if (!ttclass._javascriptDirty)
            continue;

        console.log(`loading ${ttclass.name}`);

        let ctx = Object.create(ttcontext);
        let body = `with (this) {\n\n` +
            `${ttclass._javascript}\n\n` +
            `return __tt_exported_class; }\n` +
            `//# sourceURL=${ttclass.name}.js`;
        let fn = new Function(body).bind(ctx);
        let classImpl = fn();
        if (classImpl) {
            Object.defineProperty(classImpl, 'name', { value: ttclass.name });

            /* We have to leave existing properties because they may contain static
             * class state. */

            for (let methodName of Object.getOwnPropertyNames(classImpl)) {
                if (methodName == "__id")
                    continue;
                if ((methodName != "length") && (methodName != "name") && (methodName != "prototype"))
                    ttclass[methodName] = classImpl[methodName];
            }

            /* Delete existing methods before updating the prototype in case a stale
             * method aliases one defined by a superclass. */

            for (let key of Object.keys(ttclass.prototype))
                delete ttclass.prototype[key];
            for (let methodName of Object.getOwnPropertyNames(classImpl.prototype)) {
                if (methodName == "__id")
                    continue;
                ttclass.prototype[methodName] = classImpl.prototype[methodName];
            }

            /* The prototype of a `prototype` is always Object. The *actual* superclass
            * is the prototype of newClass itself. */
            let superclass = Object.getPrototypeOf(classImpl);

            /* Construct the chain of prototypes (this is not how ES6 classes do it). */
            Object.setPrototypeOf(ttclass.prototype, superclass.prototype);
        }

        ttclass._javascriptDirty = false;
    }
};

languageServiceHost = new class implements ts.LanguageServiceHost {
    private libraries = new Map<string, string>();

    private classOfFile(path: string): any {
        return TTClassImpl.getClass(path.replace(/\.tsx$/, ""));
    }

    addLibrary(path: string, contents: string) {
        this.libraries.set(path, contents);
    }

    getScriptFileNames(): string[] {
        return Array.from(classes.keys())
            .map(name => `${name}.tsx`)
            .concat(Array.from(this.libraries.keys()));
    }

    getScriptVersion(path: string): string {
        if (this.libraries.has(path))
            return "0";
        return this.classOfFile(path)._typescriptVersion.toString();
    }

    getProjectVersion(): string {
        return projectVersion.toString();
    }

    getScriptSnapshot(path: string) {
        let text = this.libraries.get(path);
        if (text == undefined)
            text = this.classOfFile(path)._typescript;
        return ts.ScriptSnapshot.fromString(text!);
    }

    getCurrentDirectory(): string {
        return "";
    }

    getCompilationSettings(): any {
        return compilerOptions;
    }

    getDefaultLibFileName(options: any): string {
        return "lib.d.ts";
    }

    getCustomTransformers(): ts.CustomTransformers {
        return new class implements ts.CustomTransformers {
            before = [
                (context) =>
                    (sourceFile) => sanityCheckTransformer(sourceFile).apply(),
                (context) =>
                    (sourceFile) => constructorTransformer(context, sourceFile).apply()
            ];

            after = [
                (context) =>
                    (sourceFile) => deconstructorTransformer(context, sourceFile).apply()
            ];
        }
    }

    trace = console.log;
};

languageService = ts.createLanguageService(
    languageServiceHost,
    ts.createDocumentRegistry()
);

function createDiagnostic(message: string) {
    return {
        key: message,
        category: ts.DiagnosticCategory.Error,
        code: 9999,
        message: message
    };
};

class TransformedFileWithDiagnostics {
    constructor(
        public result: ts.SourceFile,
        public diagnostics: ReadonlyArray<ts.DiagnosticWithLocation>) { }

    apply(): ts.SourceFile {
        for (let d of this.diagnostics) {
            let classname = d.file.fileName.replace(/\.tsx$/, "");
            let ttclass = classes.get(classname);
            if (ttclass)
                ttclass._errors.push(d);
        }

        return this.result!;
    }
}

function sanityCheckTransformer(node: ts.SourceFile): TransformedFileWithDiagnostics {
    let diagnostics: ts.DiagnosticWithLocation[] = [];
    let theClass: ts.ClassLikeDeclaration | null = null;
    for (let statement of node.statements) {
        if (ts.isClassDeclaration(statement) || ts.isInterfaceDeclaration(statement)) {
            if (theClass)
                diagnostics.push(ts.createDiagnosticForNodeInSourceFile(node, statement,
                    createDiagnostic("TypeTalk files must contain precisely one class")));
            else
                theClass = statement as ts.ClassLikeDeclaration;
        } else if (ts.isEmptyStatement(statement)) {
            /* Do nothing, these are legal */
        } else
            diagnostics.push(ts.createDiagnosticForNodeInSourceFile(node, statement,
                createDiagnostic(`Illegal statement ${statement.kind}`)));
    }

    if (theClass) {
        for (let member of theClass.members) {
            if (ts.isPropertyDeclaration(member)) {
                let theProperty = member as ts.PropertyDeclaration;
                if (theProperty.modifiers && theProperty.initializer) {
                    for (let modifier of theProperty.modifiers) {
                        if (modifier.kind == ts.SyntaxKind.StaticKeyword) {
                            diagnostics.push(ts.createDiagnosticForNodeInSourceFile(node, member,
                                createDiagnostic(`Static properties in TypeTalk classes can't be initialised`)));
                        }
                    }
                }
            }
        }
    }

    return new TransformedFileWithDiagnostics(node, diagnostics);
}

function constructorTransformer(context: ts.TransformationContext, node: ts.SourceFile): TransformedFileWithDiagnostics {
    function visitor(node: ts.Node): ts.VisitResult<ts.Node> {
        if (!ts.isClassDeclaration(node))
            return node

        let theClass = node as ts.ClassDeclaration;
        let hasConstructor = false;
        for (let member of theClass.members) {
            hasConstructor = hasConstructor || ts.isConstructorDeclaration(member);
        }
        if (hasConstructor)
            return node;

        return ts.updateClassDeclaration(
            theClass,
            theClass.decorators,
            theClass.modifiers,
            theClass.name,
            theClass.typeParameters,
            theClass.heritageClauses,
            theClass.members.concat(
                ts.createConstructor(
                    undefined,
                    undefined,
                    [
                        ts.createParameter(
                            undefined,
                            undefined,
                            ts.createToken(ts.SyntaxKind.DotDotDotToken),
                            "args"
                        )
                    ],
                    ts.createBlock(
                        [
                            ts.createStatement(
                                ts.createCall(
                                    ts.createSuper(),
                                    undefined,
                                    [
                                        ts.createSpread(
                                            ts.createIdentifier("args")
                                        )
                                    ]
                                )
                            )
                        ]
                    )
                )
            )
        );
    }

    return new TransformedFileWithDiagnostics(ts.visitEachChild(node, visitor, context), []);
}

function deconstructorTransformer(ctx: ts.TransformationContext, node: ts.SourceFile): TransformedFileWithDiagnostics {
    let diagnostics: ts.DiagnosticWithLocation[] = [];
    let seenClass = false;
    for (let statement of node.statements) {
        if (ts.isClassDeclaration(statement))
            seenClass = true;
    }
    if (!seenClass) {
        /* No class has been seen, which means this is an interface (which TypeScript compiles
         * into no code). Add a dummy declaration to keep the rest of the runtime happy. */
        return new TransformedFileWithDiagnostics(
            ts.updateSourceFileNode(
                node,
                ts.createNodeArray([
                    ts.createExpressionStatement(
                        ts.createAssignment(
                            ts.createIdentifier("__tt_exported_class"),
                            ts.createNull()
                        )
                    )
                ])
            ),
            diagnostics
        );
    }

    function visitConstructorNodes(node: ts.Node): ts.VisitResult<ts.Node> {
        /* Don't iterate into class expressions. */
        if (ts.isClassLike(node))
            return node;
        if (node.kind == ts.SyntaxKind.SuperKeyword) {
            /* Rewrite any calls to super to super.__constructor. */
            return ts.createPropertyAccess(
                ts.createSuper(),
                "__constructor");
        }
        return ts.visitEachChild(node, visitConstructorNodes, ctx);
    }

    function visitMembers(node: ts.Node): ts.VisitResult<ts.Node> {
        if (ts.isConstructorDeclaration(node)) {
            return ts.createMethod(
                node.decorators,
                node.modifiers,
                node.asteriskToken,
                "__constructor",
                node.questionToken,
                node.typeParameters,
                node.parameters,
                node.type,
                ts.visitEachChild((node as ts.ConstructorDeclaration).body,
                    visitConstructorNodes, ctx));
        }
        if (ts.isClassDeclaration(node)) {
            let theClass = node as ts.ClassLikeDeclaration;
            let hasExtension = false;
            if (theClass.heritageClauses) {
                for (let clause of theClass.heritageClauses)
                    hasExtension = hasExtension || (clause.token == ts.SyntaxKind.ExtendsKeyword);
            }

            let clauses = theClass.heritageClauses
            if (!hasExtension && ts.isClassDeclaration(theClass)) {
                if (!clauses)
                    clauses = ts.createNodeArray();
                clauses = ts.createNodeArray(
                    clauses.concat(
                        ts.createHeritageClause(
                            ts.SyntaxKind.ExtendsKeyword,
                            [ts.createExpressionWithTypeArguments(
                                undefined,
                                ts.createIdentifier("TTObject")
                            )]
                        )
                    )
                );
            }

            if (ts.isClassDeclaration(theClass))
                node = ts.updateClassDeclaration(
                    theClass,
                    theClass.decorators,
                    theClass.modifiers,
                    ts.createIdentifier("__tt_exported_class"),
                    theClass.typeParameters,
                    clauses,
                    theClass.members
                );
            else if (ts.isInterfaceDeclaration(theClass))
                node = ts.updateInterfaceDeclaration(
                    theClass,
                    theClass.decorators,
                    theClass.modifiers,
                    ts.createIdentifier("__tt_exported_class"),
                    theClass.typeParameters,
                    theClass.heritageClauses,
                    theClass.members
                );
            else
                throw "object is not a class or interface";


            return ts.visitEachChild(node, visitMembers, ctx);
        }
        if (ts.isMethodDeclaration(node) || ts.isPropertyDeclaration(node)) {
            return node;
        }
        return ts.visitEachChild(node, visitMembers, ctx);
    }

    return new TransformedFileWithDiagnostics(
        ts.visitEachChild(node, visitMembers, ctx),
        diagnostics
    );
}

ttcontext.globals = ttcontext;

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
                console.log(`loading ${className}`);
                TTClassImpl.addClass(className).setSource(script.text);
            }
        }
    }
})();

TTClassImpl.recompile();
let browser = new ttcontext.Browser();

browser.run();
//(async () => await browser.run())();

