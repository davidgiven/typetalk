class UpdateSuperclassConstructorTest extends AbstractTest {
    run() {
        TTClass.addClass("TestClass").setSource(`
            class TestClass {
                static result: number;
                constructor() {
                    TestClass.result = 1;
                }
            };
        `);

        TTClass.addClass("TestSubclass").setSource(`
            class TestSubclass extends TestClass {
            };
        `);

        TTClass.recompile();
        let o = new globals.TestSubclass();
        this.assert(globals.TestClass.result == 1, "superclass constructor did not fire");

        TTClass.addClass("TestClass").setSource(`
            class TestClass {
                static result: number;
                constructor() {
                    TestClass.result = 2;
                }
            };
        `);
        TTClass.recompile();

        o = new globals.TestSubclass();
        this.assert(globals.TestClass.result == 2, "updated superclass constructor did not fire");
    }
}