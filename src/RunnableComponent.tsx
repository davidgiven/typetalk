/* The runtime will look for Runnable subclasses to create the starup menu. */

abstract class RunnableComponent extends Component {
    abstract name(): string;
    abstract run(): void;
}
