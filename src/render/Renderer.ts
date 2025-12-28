import { World } from "../core/World";

function getRandomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function getRandomColor() {
    return `rgb(${Math.floor(255 - 42.5 * getRandomInt(1, 10))} ${Math.floor(
        255 - 42.5 * getRandomInt(1, 10),
    )} 0)`;
}

export class Renderer {
    constructor(private ctx: CanvasRenderingContext2D) { }

    draw(world: World) {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        for (const body of world.bodies) {
            this.ctx.fillStyle = body.render.color;
            this.ctx.fillRect(
                body.position.x,
                body.position.y,
                body.size.x,
                body.size.y
            );
        }
    }
}

export class RenderComponent {
    public color: string;

    constructor(color: string) {
        this.color = color;
    }
}