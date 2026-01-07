import { World } from "../core/World.js";
import { Body, ShapeType } from "../physics/Body.js";
import { extractVelocityHue, getRandomColor, getVelocityColor } from "../util/util.js";

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
            if (body.color.includes("velocity"))
                ctx.fillStyle = getVelocityColor(body.linear_velocity.magnitude(), extractVelocityHue(body.color));
            else if (body.color == "rainbow")
                ctx.fillStyle = `hsl(${this.hue / 5}, ${70}%, ${60}%)`;
            else
                ctx.fillStyle = body.color;


            if (body.shapeType === ShapeType.Circle)
                this.drawCircle(body);
            else
                this.drawPolygon(body);

        }
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

    private drawPolygon(body: Body) {
        const ctx = this.ctx;
        const { x, y } = body.position;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(body.incline);

        ctx.beginPath();
        ctx.moveTo(body.vertices[0].x, body.vertices[0].y);

        for (let i = 1; i < body.vertices.length; i++) {
            const v = body.vertices[i];
            ctx.lineTo(v.x, v.y);
        }

        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}
