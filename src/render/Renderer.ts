import { World } from "../core/World";
import { ShapeType } from "../physics/Body";
import { getAccelerationColor, getVelocityColor } from "../util/util";

export class Renderer {
    constructor(private ctx: CanvasRenderingContext2D) {
        // this.ctx.fillStyle = "rgba(0, 0, 0, 1)";
        // this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    draw(world: World) {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        // this.ctx.fillStyle = "rgba(0, 0, 0, 0.05)"; // adjust alpha for fade strength
        // this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        for (const body of world.bodies) {
            // if (body.render.color === "grey" || body.render.color === "red")
            //     this.ctx.fillStyle = body.render.color;
            // else
            this.ctx.fillStyle = getVelocityColor(body.velocity.magnitude());
            // this.ctx.fillStyle = getAccelerationColor(body.force.magnitude() * body.invMass, world.maxAcceleration);
            if (body.shapeType === ShapeType.Box) {
                this.ctx.fillRect(
                    body.position.x - body.size.x / 2, // Subtract half width
                    body.position.y - body.size.y / 2, // Subtract half height
                    body.size.x,
                    body.size.y
                );
            } else if (body.shapeType === ShapeType.Circle) {
                this.ctx.beginPath(); // Start a new path
                this.ctx.arc(
                    body.position.x,
                    body.position.y,
                    body.radius,
                    0,
                    2 * Math.PI
                );
                this.ctx.fill(); // Actually draw the circle
                this.ctx.closePath();
            }
        }
    }
}

export class RenderComponent {
    public color: string;

    constructor(color: string) {
        this.color = color;
    }
}