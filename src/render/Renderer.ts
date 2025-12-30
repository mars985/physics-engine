import { World } from "../core/World.js";
import { Body, ShapeType } from "../physics/Body.js";
import { getVelocityColor } from "../util/util.js";

export enum RenderLayer {
    Background,
    Bodies,
    Debug,
}

export class Renderer {
    constructor(private ctx: CanvasRenderingContext2D) { }

    draw(world: World, layers: RenderLayer[] = [RenderLayer.Bodies]) {
        const ctx = this.ctx;
        // ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        if (layers.includes(RenderLayer.Bodies)) {
            this.drawBodies(world);
        }

        if (layers.includes(RenderLayer.Debug)) {
            this.drawDebug(world);
        }
    }

    private drawBodies(world: World) {
        const ctx = this.ctx;

        ctx.save();
        ctx.globalCompositeOperation = "darken";
        ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.restore();

        for (const body of world.bodies) {
            ctx.fillStyle = body.movable ? getVelocityColor(body.velocity.magnitude()) : body.render.color;

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
            h
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

    private drawDebug(world: World) {
        const ctx = this.ctx;

        for (const body of world.bodies) {
            // Velocity vector
            ctx.strokeStyle = "cyan";
            ctx.beginPath();
            ctx.moveTo(body.position.x, body.position.y);
            ctx.lineTo(
                body.position.x + body.velocity.x,
                body.position.y + body.velocity.y
            );
            ctx.stroke();

            // Acceleration (force)
            ctx.strokeStyle = "orange";
            ctx.beginPath();
            ctx.moveTo(body.position.x, body.position.y);
            ctx.lineTo(
                body.position.x + body.force.x * 0.1,
                body.position.y + body.force.y * 0.1
            );
            ctx.stroke();
        }
    }

    beginCamera(camera: { x: number; y: number; zoom: number }) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(-camera.x, -camera.y);
        ctx.scale(camera.zoom, camera.zoom);
    }

    endCamera() {
        this.ctx.restore();
    }

    private isVisible(body: Body, width: number, height: number) {
        return (
            body.position.x + body.size.x > 0 &&
            body.position.x - body.size.x < width &&
            body.position.y + body.size.y > 0 &&
            body.position.y - body.size.y < height
        );
    }
}

export class RenderComponent {
    public color: string;

    constructor(color: string) {
        this.color = color;
    }
}