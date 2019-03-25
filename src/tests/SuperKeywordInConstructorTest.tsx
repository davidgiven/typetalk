class SuperKeywordInConstructorTest extends AbstractTest {
    run() {
        TTClass.addClass("TestClass").setSource(`
            class TestClass {
                value: number;

                constructor(v) {
                    this.value = v;
                }
            };
        `);

        TTClass.addClass("TestSubclass").setSource(`
            class TestSubclass extends TestClass {
                constructor() {
                    super(7);
                }
            };
        `);

        TTClass.recompile();
        let o = new globals.TestSubclass();
        this.assert(o.value == 7, "incorrect value calculated");
    }
}
