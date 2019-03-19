let compilerOptions: ts.CompilerOptions = {
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

ttcontext.TTObject = class TTObject {
    constructor(...args) {
        this.__constructor(...args);
    }

    __constructor(...args) { }
};

let targetSymbol = Symbol.for("typetalk-target");
let superclassSymbol = Symbol.for("typetalk-superclass");
function createClassProxy(name: string) {
    let target: any = new Function(`return function ${name}() {};`)();
    return new Proxy(class { },
        new class implements ProxyHandler<Object> {
            getPrototypeOf(t) { return Object.getPrototypeOf(target); }
            setPrototypeOf(t, v) { Object.setPrototypeOf(target, v); return true; }
            isExtensible() { return true; }
            preventExtensions() { return false; }
            getOwnPropertyDescriptor(t, p) { return Object.getOwnPropertyDescriptor(target, p); }
            has(t, p) { return p in target; }
            deleteProperty(t, p) { delete target[p]; return true; }
            defineProperty(t, p, attrs) { return true; }
            enumerate(t) { return target[Symbol.iterator]; }
            ownKeys(t) { return Reflect.ownKeys(target); }
            apply(t, args) { return target.apply(...args); }

            construct(t, args, newTarget) {
                let o: any = {};
                Object.setPrototypeOf(o, target.prototype);
                o.__constructor(...args);
                return o;
            }

            get(t, p) {
                if (p == targetSymbol)
                    return target;
                if (p == "prototype")
                    return t.prototype;
                return target[p];
            }

            set(t, p, v) {
                if (p == targetSymbol)
                    target = v;
                else
                    target[p] = v;
                return true;
            }
        }
    );
}

function updateClass(oldClass: any, newClass: any): void {
    let oldClassTarget = oldClass[targetSymbol];

    for (let methodName of Object.getOwnPropertyNames(newClass)) {
        if ((methodName != "length") && (methodName != "name") && (methodName != "prototype"))
            oldClassTarget[methodName] = newClass[methodName];
    }

    for (let methodName of Object.getOwnPropertyNames(newClass.prototype))
        oldClassTarget.prototype[methodName] = newClass.prototype[methodName];

    let superclass = Object.getPrototypeOf(newClass.prototype);
    Object.setPrototypeOf(oldClass.prototype, superclass);
    oldClassTarget[superclassSymbol] = superclass;
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

        /* If this class hasn't been defined yet, install a placeholder so other
         * classes can refer to it. */
        if (!ttcontext[className]) {
            ttcontext[className] = createClassProxy(className);
        }
    }

    recompile() {
        let errors = false;
        classRegistry.getAllClasses()
            .filter(ttclass => ttclass.javascriptDirty)
            .forEach(
                (ttclass) => {
                    let filename = `${ttclass.className}.tsx`;
                    console.log(`compiling ${ttclass.className}`);

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

            updateClass(ttcontext[ttclass.className], createdClass);
            ttclass.javascriptDirty = false;
        };

        this.getAllClasses()
            .filter(ttclass => ttclass.javascriptDirty)
            .forEach(reloadRecursively);
    }
};

languageServiceHost = new class implements ts.LanguageServiceHost {
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

    getScriptVersion(path: string): string {
        if (this.libraries.has(path))
            return "0";
        return this.classOfFile(path).typescriptVersion.toString();
    }

    getProjectVersion(): string {
        return classRegistry.getProjectVersion().toString();
    }

    getScriptSnapshot(path: string) {
        let text = this.libraries.get(path);
        if (text == undefined)
            text = this.classOfFile(path).typescript;
        return ts.ScriptSnapshot.fromString(text);
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
                (context) => sanityCheckTransformer,
                (context) => 
                    (sourceFile) => constructorTransformer(context, sourceFile)
            ];

            after = [
                (context) =>
                    (sourceFile) => deconstructorTransformer(context, sourceFile)
            ];
        }
    }

    trace = console.log;
};

languageServices = ts.createLanguageService(
    languageServiceHost,
    ts.createDocumentRegistry()
);

function sanityCheckTransformer(node: ts.SourceFile): ts.SourceFile {
    let theClass: ts.ClassLikeDeclaration | null = null;
    for (let statement of node.statements) {
        if (ts.isClassLike(statement)) {
            if (theClass)
                throw "TypeTalk files must contain precisely one class";
            theClass = statement as ts.ClassLikeDeclaration;
        } else if (ts.isEmptyStatement(statement)) {
            /* Do nothing, these are legal */
        }
        else
            throw `illegal statement ${statement.kind}`;
    }

    if (theClass) {
        for (let member of theClass.members) {
            if (ts.isPropertyDeclaration(member)) {
                let theProperty = member as ts.PropertyDeclaration;
                if (theProperty.modifiers && theProperty.initializer) {
                    for (let modifier of theProperty.modifiers) {
                        if (modifier.kind == ts.SyntaxKind.StaticKeyword) {
                            throw "Static properties in TypeTalk classes can't be initialised";
                        }
                    }
                }
            }
        }
    }

    return node;
}

function constructorTransformer(context: ts.TransformationContext, node: ts.SourceFile): ts.SourceFile {
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

    return ts.visitEachChild(node, visitor, context);
}

function deconstructorTransformer(ctx: ts.TransformationContext, node: ts.SourceFile): ts.SourceFile {
    let seenClass = false;
    for (let statement of node.statements) {
        if (ts.isClassLike(statement)) {
            if (seenClass)
                throw "TypeTalk files must contain precisely one class";
            seenClass = true;
        }
    }

    function visitConstructorNodes(node: ts.Node): ts.VisitResult<ts.Node> {
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
            let theClass = node as ts.ClassDeclaration;
            let hasExtension = false;
            if (theClass.heritageClauses) {
                for (let clause of theClass.heritageClauses)
                    hasExtension = hasExtension || (clause.token == ts.SyntaxKind.ExtendsKeyword);
            }

            if (!hasExtension) {
                let oldClauses: ts.NodeArray<ts.HeritageClause> = ts.createNodeArray<ts.HeritageClause>();
                if (theClass.heritageClauses)
                    oldClauses = theClass.heritageClauses;
                node = ts.updateClassDeclaration(
                    theClass,
                    theClass.decorators,
                    theClass.modifiers,
                    theClass.name,
                    theClass.typeParameters,
                    oldClauses.concat(
                        ts.createHeritageClause(
                            ts.SyntaxKind.ExtendsKeyword,
                            [ts.createExpressionWithTypeArguments(
                                undefined,
                                ts.createIdentifier("TTObject")
                            )]
                        )
                    ),
                    theClass.members
                );
            }

            return ts.visitEachChild(node, visitMembers, ctx);
        }
        if (ts.isMethodDeclaration(node) || ts.isPropertyDeclaration(node)) {
            return node;
        }
        return ts.visitEachChild(node, visitMembers, ctx);
    }

    return ts.visitEachChild(node, visitMembers, ctx);
}

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
