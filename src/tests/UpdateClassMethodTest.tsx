class UpdateClassMethodTest extends AbstractTest {
    run() {
        TTClass.addClass("TestClass").setSource( `
            class TestClass {
                m(): number { return 1; }
            };
        `);

        TTClass.recompile();
        let o = new globals.TestClass();
        this.assert(o.m() == 1, "method did not fire");

        TTClass.addClass("TestClass").setSource(`
            class TestClass {
                m(): number { return 2; }
            };
        `);
        TTClass.recompile();

        this.assert(o.m() == 2, "updated method did not fire");
    }
}