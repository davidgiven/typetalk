abstract class AbstractTest {
    abstract run(): void;
    
    assert(condition: boolean, message: string): void {
        if (!condition)
            throw message;
    }
}
