class UpdateClassConstructorTest extends AbstractTest {
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
            class TestSubclass {}
        `);

        TTClass.recompile();
        let o = new globals.TestClass();
        this.assert(globals.TestClass.result == 1, "superclass constructor did not fire");
    }
}