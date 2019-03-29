class GameTestRunnable extends GameRunnable {
    static title() { return "Test game" }

    constructor() {
        super(GameTestRunnable.title());
    }

    redraw(ctx, delta) {
        ctx.fillStyle = "#888";
        ctx.fillRect(0, 0, 400, 400);

        ctx.fillStyle = "#f00";
        ctx.fillRect(this.mouseX - 10, this.mouseY - 10, 20, 20);
    }
}
