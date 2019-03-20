class SuperKeywordInMethodTest extends AbstractTest {
    run() {
        classRegistry.set("TestClass", null, `
            class TestClass {
                m(): number { return 1; }
            };
        `);

        classRegistry.set("TestSubclass", null, `
            class TestSubclass extends TestClass {
                m(): number { return super.m() + 1; }
            };
        `);

        classRegistry.recompile();
        let o = new globals.TestSubclass();
        this.assert(o.m() == 2, "incorrect value calculated");
    }
}
