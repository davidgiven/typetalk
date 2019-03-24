interface HTMLComponentElement extends HTMLElement {
    component?: Set<UiComponent<any>>;
    ref?: (HTMLComponentElement) => void;
}
