class UpdateSuperclassMethodTest extends AbstractTest {
    run() {
        classRegistry.set("TestClass",
        `
            class TestClass {
                m(): number { return 1; }
            };
        `);

        classRegistry.set("TestSubclass",
        `
            class TestSubclass extends TestClass {
            };
        `);

        classRegistry.recompile();
        let o = new globals.TestSubclass();
        this.assert(o.m() == 1, "superclass method did not fire");

        classRegistry.set("TestClass",
        `
            class TestClass {
                m(): number { return 2; }
            };
        `);
        classRegistry.recompile();

        this.assert(o.m() == 2, "updated superclass method did not fire");
    }
}