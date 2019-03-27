class RemoveMethodBelongingToSuperclassTest extends AbstractTest {
    run() {
        let testClass = TTClass.addClass("TestClass");
        let testSubclass = TTClass.addClass("TestSubclass");

        testClass.setSource(`
            class TestClass {
                m(): number { return 1; }
            };
        `);

        testSubclass.setSource(`
            class TestSubclass extends TestClass {
                m(): number { return 2; }
            };
        `);

        TTClass.recompile();
        let o = new globals.TestSubclass();
        this.assert(o.m() == 2, "incorrect value calculated");

        testSubclass.setSource(`
            class TestSubclass extends TestClass {
            };
        `);
        TTClass.recompile();

        this.assert(o.m() == 1, "incorrect value after method removed");
        o = new globals.TestSubclass();
        this.assert(o.m() == 1, "incorrect value after method removed and new object");
    }
}

