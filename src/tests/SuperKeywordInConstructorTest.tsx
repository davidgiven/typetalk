class SuperKeywordInConstructorTest extends AbstractTest {
    run() {
        classRegistry.set("TestClass", null, `
            class TestClass {
                value: number;

                constructor(v) {
                    this.value = v;
                }
            };
        `);

        classRegistry.set("TestSubclass", null, `
            class TestSubclass extends TestClass {
                constructor() {
                    super(7);
                }
            };
        `);

        classRegistry.recompile();
        let o = new globals.TestSubclass();
        this.assert(o.value == 7, "incorrect value calculated");
    }
}
