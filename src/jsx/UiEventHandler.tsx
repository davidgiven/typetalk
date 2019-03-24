interface UiEventHandler<E extends Event> {
    (event: E): void;
}

