class Observable<T> {
    private static firedObservers: Set<Observable<any>> | null;
    private observers = new Set<(T) => void>();

    addObserver(observer): void {
        this.observers.add(observer);
    }

    removeObserver(observer): void {
        this.observers.delete(observer);
    }

    didChange(): void {
        if (!Observable.firedObservers)
            setTimeout(Observable.fireAllObservers);
        Observable.firedObservers = new Set([this]);
    }

    private fireObservers(): void {
        let oldObservers = this.observers;
        this.observers = new Set<(T) => void>();

        for (let observer of oldObservers)
            observer(this);

    }

    private static fireAllObservers(): void {
        let oldObservables = this.firedObservers;
        Observable.firedObservers = null;

        if (oldObservables) {
            for (let observable of oldObservables)
                observable.fireObservers();
        }
    }
}
