class UpdateSuperclassMethodTest extends AbstractTest {
    run() {
        TTClass.addClass("TestClass").setSource(`
            class TestClass {
                m(): number { return 1; }
            };
        `);

        TTClass.addClass("TestSubclass").setSource(`
            class TestSubclass extends TestClass {
            };
        `);

        TTClass.recompile();
        let o = new globals.TestSubclass();
        this.assert(o.m() == 1, "superclass method did not fire");

        TTClass.addClass("TestClass").setSource(`
            class TestClass {
                m(): number { return 2; }
            };
        `);
        TTClass.recompile();

        this.assert(o.m() == 2, "updated superclass method did not fire");
    }
}