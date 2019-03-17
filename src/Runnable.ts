/* The runtime will look for Runnable subclasses to create the starup menu. */

abstract class Runnable {
    abstract name(): string;
    abstract run(): void;
}
