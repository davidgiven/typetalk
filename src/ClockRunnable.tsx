class ClockRunnable extends Runnable<any> {
    protected ids = new class {
        canvas?: HTMLCanvasElement;
    };

    static title() {
        return "Dubious clock";
    }

    async run() {
        super.run();

        let ctx = this.ids.canvas!.getContext("2d")!;

        function sleep(ms: number) {
            return new Promise(resolve => window.setTimeout(resolve, ms));
        }
      
        for (;;) {
            this.redraw(ctx);
            await sleep(1000);
        }
    }

    private redraw(ctx) {
        function drawHand(angle, length) {
            angle -= Math.PI / 2;
            ctx.moveTo(100, 100);
            ctx.lineTo(100 + Math.cos(angle)*length, 100 + Math.sin(angle)*length);
        }

        let RADIUS = 90;
        ctx.strokeStyle = "#000";
        ctx.fillStyle = "#ccc";

        ctx.fillRect(0, 0, 200, 200);
        ctx.beginPath();
        ctx.arc(100, 100, RADIUS, 0, 2*Math.PI);

        let now = new Date()
        drawHand(now.getSeconds() * 2*Math.PI / 60, RADIUS * 9/10);
        drawHand(now.getMinutes() * 2*Math.PI / 60, RADIUS * 2/3);
        drawHand(now.getHours() * 2*Math.PI / 24, RADIUS * 1/3);

        ctx.stroke();
    }

    render(jsx, props) {
        return <JsxWindow title="Dubious clock">
            <canvas id="canvas" width="200" height="200"/>
        </JsxWindow>;
    }
}
