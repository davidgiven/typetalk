class UpdateClassConstructorTest extends AbstractTest {
    run() {
        classRegistry.set("TestClass",
        `
            class TestClass {
                static result: number;
                constructor() {
                    TestClass.result = 1;
                }
            };
        `);

        classRegistry.recompile();
        let o = new globals.TestClass();
        this.assert(globals.TestClass.result == 1, "superclass constructor did not fire");
    }
}