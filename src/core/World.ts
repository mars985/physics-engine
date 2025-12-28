import { Body } from "../physics/Body";
import { AABB } from "../math/AABB";
import { Resolution } from "../physics/Resolution";
import { Vec2 } from "../math/Vec2";

export class World {
    bodies: Body[] = [];
    gravity = new Vec2(10, 90);

    add(body: Body) {
        this.bodies.push(body);
    }

    step(dt: number) {
        // integrate motion
        for (const body of this.bodies) {
            body.integrate(dt, this.gravity);
        }

        // collision detection
        for (let i = 0; i < this.bodies.length; i++) {
            for (let j = i + 1; j < this.bodies.length; j++) {
                const a = this.bodies[i];
                const b = this.bodies[j];

                const manifold = AABB.AABBvsAABB(a, b);
                if (manifold) {
                    Resolution.resolve(a, b, manifold);
                }
            }
        }
    }
}
