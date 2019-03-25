class SuperKeywordInMethodTest extends AbstractTest {
    run() {
        TTClass.addClass("TestClass").setSource(`
            class TestClass {
                m(): number { return 1; }
            };
        `);

        TTClass.addClass("TestSubclass").setSource(`
            class TestSubclass extends TestClass {
                m(): number { return super.m() + 1; }
            };
        `);

        TTClass.recompile();
        let o = new globals.TestSubclass();
        this.assert(o.m() == 2, "incorrect value calculated");
    }
}
