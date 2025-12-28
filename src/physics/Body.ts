import { Vec2 } from '../math/Vec2'
import { RenderComponent } from '../render/Renderer';

export class Body {
    position: Vec2;
    velocity: Vec2;
    mass: number;
    invMass: number;
    size: Vec2;
    restitution: number;
    render: RenderComponent;

    constructor(x: number, y: number, w = 50, h = 40, mass = 1, vx = 0, vy = 0, restitution = 1, color = "white") {
        this.position = new Vec2(x, y);
        this.velocity = new Vec2(vx, vy);
        this.mass = mass;
        this.invMass = mass === 0 ? 0 : 1 / mass;
        this.size = new Vec2(w, h);
        this.restitution = restitution;
        this.render = new RenderComponent(color);
    }

    integrate(dt: number, gravity: Vec2) {
        this.velocity.x += gravity.x * dt;
        this.velocity.y += gravity.y * dt;

        this.position.x += this.velocity.x * dt;
        this.position.y += this.velocity.y * dt;
        console.log(this.position);
    }
}