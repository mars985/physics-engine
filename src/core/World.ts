import { Body } from '../physics/Body'
import { Vec2 } from '../math/Vec2'

export class World {
    bodies: Body[] = [];
    gravity = new Vec2(0, 980);

    add(body: Body) {
        this.bodies.push(body);
    }

    step(dt: number) {
        for (const body of this.bodies) {
            body.integrate(dt, this.gravity);
        }
    }
}