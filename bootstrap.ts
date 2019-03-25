let compilerOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2015,
    downlevelIteration: true,
    strict: true,
    suppressOutputPathCheck: false,
    extendedDiagnostics: true,
    noEmitHelpers: true,
    jsx: ts.JsxEmit.React,
    jsxFactory: "jsx",
    noImplicitAny: false,
};

let languageServiceHost;
let languageService;

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
    return new Function(`
        return function ${name}(...args) {
            this.__constructor(...args);
        };
        `)();
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

TTClassImpl.prototype.setSource = function (typescript) {
    if (this._typescript != typescript) {
        this._typescript = typescript;
        this._typescriptVersion++;
        this._javascriptDirty = true;
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
    for (let ttclass of classes.values()) {
        if (!ttclass._javascriptDirty)
            continue;

        let filename = `${ttclass.name}.tsx`;
        console.log(`compiling ${ttclass.name}`);

        languageService
            .getCompilerOptionsDiagnostics()
            .concat(languageService.getSyntacticDiagnostics(filename))
            .concat(languageService.getSemanticDiagnostics(filename))
            .forEach((d: any) => {
                console.log(d.messageText);
                errors = true;
            });

        let output = languageService.getEmitOutput(filename);
        if (!output.emitSkipped) {
            for (let f of output.outputFiles) {
                if (f.name !== `${ttclass.name}.js`)
                    throw `filename mismatch: got ${f.name}, expected ${filename}`;
                if (ttclass._javascript == f.text)
                    ttclass._javascriptDirty = false;
                else
                    ttclass._javascript = f.text;
            }
        }
    }

    if (errors) {
        console.log("compilation failed");
        return;
    }

    for (let ttclass of classes.values()) {
        if (!ttclass._javascriptDirty)
            continue;

        console.log(`loading ${ttclass.name}`);

        let ctx = Object.create(ttcontext);
        let body = `with (this) {\n\n${ttclass._javascript}\n\n` +
            `return __tt_exported_class; }\n` +
            `//# sourceURL=${ttclass.name}.js`;
        let fn = new Function(body).bind(ctx);
        let classImpl = fn();
        if (classImpl) {
            Object.defineProperty(classImpl, 'name', { value: ttclass.name });

            for (let methodName of Object.getOwnPropertyNames(classImpl)) {
                if ((methodName != "length") && (methodName != "name") && (methodName != "prototype"))
                    ttclass[methodName] = classImpl[methodName];
            }

            for (let methodName of Object.getOwnPropertyNames(classImpl.prototype))
                ttclass.prototype[methodName] = classImpl.prototype[methodName];

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

languageService = ts.createLanguageService(
    languageServiceHost,
    ts.createDocumentRegistry()
);

function sanityCheckTransformer(node: ts.SourceFile): ts.SourceFile {
    let theClass: ts.ClassLikeDeclaration | null = null;
    for (let statement of node.statements) {
        if (ts.isClassDeclaration(statement) || ts.isInterfaceDeclaration(statement)) {
            if (theClass)
                throw "TypeTalk files must contain precisely one class";
            theClass = statement as ts.ClassLikeDeclaration;
        } else if (ts.isEmptyStatement(statement)) {
            /* Do nothing, these are legal */
        } else
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
        if (ts.isClassDeclaration(statement)) {
            if (seenClass)
                throw "TypeTalk files must contain precisely one class";
            seenClass = true;
        }
    }
    if (!seenClass) {
        /* No class has been seen, which means this is an interface (which TypeScript compiles
         * into no code). Add a dummy declaration to keep the rest of the runtime happy. */
        return ts.updateSourceFileNode(
            node,
            ts.createNodeArray([
                ts.createExpressionStatement(
                    ts.createAssignment(
                        ts.createIdentifier("__tt_exported_class"),
                        ts.createNull()
                    )
                )
            ])
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

    return ts.visitEachChild(node, visitMembers, ctx);
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
