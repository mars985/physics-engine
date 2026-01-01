import { World } from "../core/World.js";
import { Body, ShapeType } from "../physics/Body.js";
import { getRandomColor, getVelocityColor } from "../util/util.js";

export class Renderer {
    constructor(private ctx: CanvasRenderingContext2D) { }

    private hue = 0;

    draw(world: World) {
        this.hue++;
        const ctx = this.ctx;
        const ALPHA = 0.5;

        ctx.save();
        ctx.globalCompositeOperation = "darken";
        ctx.fillStyle = `rgba(0, 0, 0, ${ALPHA})`;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.restore();

        for (const body of world.bodies) {
            switch (body.color) {
                case "velocity":
                    ctx.fillStyle = getVelocityColor(body.velocity.magnitude());
                    break;
                case "rainbow":
                    ctx.fillStyle = `hsl(${this.hue / 5}, ${70}%, ${60}%)`;
                    break;
                default:
                    ctx.fillStyle = body.color;
            }

            switch (body.shapeType) {
                case ShapeType.Box:
                    this.drawBox(body);
                    break;

                case ShapeType.Circle:
                    this.drawCircle(body);
                    break;
            }
        }
    }

    private drawBox(body: Body) {
        const { x, y } = body.position;
        const { x: w, y: h } = body.size;

        this.ctx.fillRect(
            x - w / 2,
            y - h / 2,
            w,
            h,
        );
    }

    private drawCircle(body: Body) {
        this.ctx.beginPath();
        this.ctx.arc(
            body.position.x,
            body.position.y,
            body.radius,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
    }
}
