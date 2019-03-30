abstract class GameRunnable extends Runnable<any> {
    protected ids = new class {
        canvas?: HTMLCanvasElement;
        fps?: HTMLDivElement;
    };
    private title: string;
    protected mouseX: number = 0;
    protected mouseY: number = 0;

    constructor(title) {
        super({});
        this.title = title;
    }

    async run() {
        super.run();

        let ctx = this.ids.canvas!.getContext("2d")!;

        function nextFrame() {
            return new Promise(resolve => window.requestAnimationFrame(resolve));
        }
      
        this.onReset();
        let meHandler = this.ids.canvas!.addEventListener("mousemove",
            (me) => this.onMouseMove(me));
        let oldTime = new Date().valueOf();
        while (this.isAttached()) {
            let newTime = new Date().valueOf();
            let delta = newTime - oldTime;
            this.ids.fps!.innerText = Math.floor(1000 / delta).toString();
            oldTime = newTime;
            this.redraw(ctx, delta);
            await nextFrame();
        }
    }

    private onMouseMove(me: MouseEvent) {
        let e = this.ids.canvas!.getBoundingClientRect();
        this.mouseX = me.clientX - e.left;
        this.mouseY = me.clientY - e.top;
        return false;
    }

    protected onReset() {}

    abstract redraw(ctx: CanvasRenderingContext2D, delta: number);

    render(jsx, props) {
        return <JsxWindow
            onClose={() => this.onClose()}
            title={this.title}>
            <JsxVBox>
                <canvas id="canvas" width="400" height="400"/>
                <JsxHBox>
                    <button onclick={() => this.onReset()}>Reset</button>
                    <div id="fps"/>
                </JsxHBox>
            </JsxVBox>
        </JsxWindow>;
    }
}

