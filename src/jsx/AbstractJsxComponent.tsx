abstract class AbstractJsxComponent<PropsT, StateT> extends preact.Component<PropsT, StateT> {
    private static fromPixels(s: string|null): number {
        if (s)
            return +s.replace(/px$/, "");
        return 0;
    }

    getPosition(): [number, number] {
        let computed = window.getComputedStyle(this.base.parentElement!);
        let winX = this.base.offsetLeft - AbstractJsxComponent.fromPixels(computed.borderLeftWidth);
        let winY = this.base.offsetTop - AbstractJsxComponent.fromPixels(computed.borderTopWidth);
        return [winX, winY];
    }

    setPosition(x: number, y: number) {
        this.base.style.left = `${x}px`;
        this.base.style.top = `${y}px`;
    }

    getSize(): [number, number] {
        return [this.base.clientWidth, this.base.clientHeight];
    }

    setSize(w: number, h: number) {
        this.base.style.width = `${w}px`;
        this.base.style.height = `${h}px`;
    }
}
