import { Vec2 } from '../math/Vec2'
import { RenderComponent } from '../render/Renderer';

export enum ShapeType { Box, Circle };

export interface BodyOptions {
    x: number;
    y: number;
    w?: number;
    h?: number;
    r?: number;
    mass?: number;
    vx?: number;
    vy?: number;
    restitution?: number;
    color?: string;
    shapeType?: ShapeType;
}

export class Body {
    position: Vec2;
    velocity: Vec2;
    size: Vec2;
    radius: number;
    mass: number;
    invMass: number;
    restitution: number;
    shapeType: ShapeType;
    render: RenderComponent;

    constructor(options: BodyOptions) {
        const {
            x,
            y,
            w = 50,
            h = 50,
            r = 20,
            mass = 1,
            vx = 0,
            vy = 0,
            restitution = 1,
            color = "white",
            shapeType = ShapeType.Box
        } = options;

        this.position = new Vec2(x, y);
        this.velocity = new Vec2(vx, vy);
        this.size = new Vec2(w, h);
        this.radius = r;
        this.mass = mass;
        this.invMass = mass === 0 ? 0 : 1 / mass;
        this.restitution = restitution;
        this.shapeType = shapeType;
        this.render = new RenderComponent(color);
    }
    integrate(dt: number, gravity: Vec2) {
        this.velocity.x += gravity.x * dt;
        this.velocity.y += gravity.y * dt;

        const damping = 0.99;
        // const damping = 1;
        this.velocity.x *= damping;
        this.velocity.y *= damping;

        const velocityThreshold = 0.5;
        if (Math.abs(this.velocity.x) < velocityThreshold)
            this.velocity.x = 0;
        if (Math.abs(this.velocity.y) < velocityThreshold)
            this.velocity.y = 0;

        this.position.x += this.velocity.x * dt;
        this.position.y += this.velocity.y * dt;
    }
}