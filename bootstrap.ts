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

let ttcontext: any = {};
Object.setPrototypeOf(ttcontext, window);

(Object as any).prototype.__constructor = (...args) => {};

ttcontext.TTObject = class TTObject {
    constructor(...args) {
        (this as any).__constructor(...args);
    }
};

function createClassProxy(name: string) {
    return new Function(`
        return function ${name}(...args) {
            this.__constructor(...args);
        };
        `)();
}

function updateClass(oldClass: any, newClass: any): void {
    for (let methodName of Object.getOwnPropertyNames(newClass)) {
        if ((methodName != "length") && (methodName != "name") && (methodName != "prototype"))
            oldClass[methodName] = newClass[methodName];
    }

    for (let methodName of Object.getOwnPropertyNames(newClass.prototype))
        oldClass.prototype[methodName] = newClass.prototype[methodName];

    /* The prototype of a `prototype` is always Object. The *actual* superclass
     * is the prototype of newClass itself. */
    let superclass = Object.getPrototypeOf(newClass);

    /* Construct the chain of prototypes (this is not how ES6 classes do it). */
    Object.setPrototypeOf(oldClass.prototype, superclass.prototype);
    Object.setPrototypeOf(oldClass, superclass);
}

class TTClass {
    className: string;
    compiledClass: any;
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

    get(className: string) {
        return this.classes.get(className);
    }

    set(className: string, source: string): void {
        let ttclass = this.resolve(className);
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

        for (let ttclass of this.getAllClasses()) {
            if (!ttclass.javascriptDirty)
                continue;
            console.log(`loading ${ttclass.className}`);

            let ctx = Object.create(ttcontext);
            let body = `with (this) {\n\n${ttclass.javascript}\n\n` +
                `return __tt_exported_class; }\n` +
                `//# sourceURL=${ttclass.className}.js`;
            let fn = new Function(body).bind(ctx);
            let createdClass = fn();
            Object.defineProperty(createdClass, 'name', {value: ttclass.className});
            let classProxy = ttcontext[ttclass.className];

            updateClass(classProxy, createdClass);
            ttclass.compiledClass = classProxy;
            ttclass.javascriptDirty = false;
        }
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
        if (ts.isClassDeclaration(statement) || ts.isInterfaceDeclaration(statement)) {
            if (seenClass)
                throw "TypeTalk files must contain precisely one class";
            seenClass = true;
        }
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
        if (ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node)) {
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
                classRegistry.set(className, script.text);
            }
        }
    }
})();

classRegistry.recompile();
let browser = new ttcontext.Browser().attachTo(document.body);
browser.start();
