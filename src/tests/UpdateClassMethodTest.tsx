class UpdateClassMethodTest extends AbstractTest {
    run() {
        classRegistry.set("TestClass",
        `
            class TestClass {
                m(): number { return 1; }
            };
        `);

        classRegistry.recompile();
        let o = new globals.TestClass();
        this.assert(o.m() == 1, "method did not fire");

        classRegistry.set("TestClass",
        `
            class TestClass {
                m(): number { return 2; }
            };
        `);
        classRegistry.recompile();

        this.assert(o.m() == 2, "updated method did not fire");
    }
}