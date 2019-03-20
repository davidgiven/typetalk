class UpdateSuperclassConstructorTest extends AbstractTest {
    run() {
        classRegistry.set("TestClass", null,
        `
            class TestClass {
                static result: number;
                constructor() {
                    TestClass.result = 1;
                }
            };
        `);

        classRegistry.set("TestSubclass", null,
        `
            class TestSubclass extends TestClass {
            };
        `);

        classRegistry.recompile();
        let o = new globals.TestSubclass();
        this.assert(globals.TestClass.result == 1, "superclass constructor did not fire");

        classRegistry.set("TestClass", null,
        `
            class TestClass {
                static result: number;
                constructor() {
                    TestClass.result = 2;
                }
            };
        `);
        classRegistry.recompile();

        o = new globals.TestSubclass();
        this.assert(globals.TestClass.result == 2, "updated superclass constructor did not fire");
    }
}