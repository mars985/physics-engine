import { World } from "../core/World";

export class Renderer {
    constructor(private ctx: CanvasRenderingContext2D) { }

    draw(world: World) {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        this.ctx.fillStyle = "white";
        for (const body of world.bodies) {
            this.ctx.fillRect(
                body.position.x,
                body.position.y,
                body.size.x,
                body.size.y
            );
        }
    }
}