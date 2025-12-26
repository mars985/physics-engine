import { Vec2 } from '../math/Vec2'

export class Body {
    position: Vec2;
    velocity: Vec2;
    mass: number;
    size: Vec2;

    constructor(x: number, y: number, w = 50, h = 40, mass = 1) {
        this.position = new Vec2(x, y);
        this.velocity = new Vec2();
        this.mass = mass;
        this.size = new Vec2(w, h);
    }

    integrate(dt: number, gravity: Vec2) {
        this.velocity.add(new Vec2(gravity.x * dt, gravity.y * dt));
        this.position.add(new Vec2(this.velocity.x * dt, this.velocity.y * dt));
    }
}