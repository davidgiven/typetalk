interface UiComponentConstructor<PropsT> {
    new (props?: PropsT): UiComponent<PropsT>;
}
