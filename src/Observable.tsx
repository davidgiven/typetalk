class Observable<T> {
    private static firedObservers = new Set<Observable<any>>();
    private observers = new Set<(T) => void>();

    addObserver(observer): void {
        this.observers.add(observer);
    }

    removeObserver(observer): void {
        this.observers.delete(observer);
    }

    didChange(): void {
        if (Observable.firedObservers.size == 0)
            setTimeout(Observable.fireAllObservers);
        Observable.firedObservers.add(this);
    }

    private fireObservers(): void {
        let oldObservers = this.observers;
        this.observers = new Set<(T) => void>();

        for (let observer of oldObservers)
            observer(this);
        
    }

    private static fireAllObservers(): void {
        let oldObservables = this.firedObservers;
        this.firedObservers = new Set<Observable<any>>();

        for (let observable of oldObservables)
            observable.fireObservers();
    }
}
