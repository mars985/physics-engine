import { Body, ShapeType } from "../physics/Body.js";
import { Resolution } from "../physics/Resolution.js";
import { Vec2 } from "../math/Vec2.js";
import { Collision, CollisionManifold } from "../physics/Collision.js";

export class World {
    bodies: Body[] = [];
    gravity = new Vec2();
    damping = 1;

    enable_collisions = false;
    enable_mutual_gravity = false;
    enable_movable_mutual_gravity = false;

    maxAcceleration = 0;        // current frame
    smoothedMaxAcceleration = 1; // for visualization

    add(body: Body): void;
    add(...bodies: Body[]): void;
    add(...bodies: Body[]): void {
        this.bodies.push(...bodies);
    }

    remove(i: number) {
        this.bodies.splice(i, 1);
    }

    clear() {
        this.bodies.length = 0;
        this.enable_collisions = false;
        this.enable_mutual_gravity = false;
        this.enable_movable_mutual_gravity = false;
        this.gravity.x = 0;
        this.gravity.y = 0;
    }

    step(dt: number) {
        if (this.enable_mutual_gravity || this.enable_movable_mutual_gravity)
            this.applyMutualGravity();

        this.integrateBodies(dt);

        if (this.enable_collisions)
            this.handleCollisions();
    }

    private applyMutualGravity() {
        const G = 100;
        const softening = 25;
        const minForceThreshold = 0.0001; // Adjust based on desired precision

        let i = 0;
        while (i < this.bodies.length && (!this.bodies[i].movable || this.enable_movable_mutual_gravity)) {
            const a = this.bodies[i];

            for (let j = i + 1; j < this.bodies.length; j++) {
                const b = this.bodies[j];

                const massProduct = a.mass * b.mass;
                if (massProduct < 0.000001) continue;

                const dx = b.position.x - a.position.x;
                const dy = b.position.y - a.position.y;
                const distSq = dx * dx + dy * dy + softening;

                if ((G * massProduct) / distSq < minForceThreshold && !(this.enable_movable_mutual_gravity && this.enable_mutual_gravity)) continue;

                const dist = Math.sqrt(distSq);
                const invDist = 1 / dist;
                const forceMag = G * massProduct * invDist * invDist;

                const forceX = dx * (forceMag * invDist);
                const forceY = dy * (forceMag * invDist);

                a.force.x += forceX;
                a.force.y += forceY;
                b.force.x -= forceX;
                b.force.y -= forceY;
            }
            i++;
        }
    }

    private integrateBodies(dt: number) {
        let frameMaxAcc = 0;

        for (const body of this.bodies) {
            if (!body.movable || body.mass === 0) continue;
            body.force.add(this.gravity.clone().scale(body.mass));

            const ax = body.force.x * body.invMass;
            const ay = body.force.y * body.invMass;

            const acc = Math.hypot(ax, ay);
            frameMaxAcc = Math.max(frameMaxAcc, acc);

            body.integrate(dt, this.damping);
        }

        // Smooth it to avoid flickering colors
        const SMOOTHING = 0.1;
        this.smoothedMaxAcceleration += (frameMaxAcc - this.smoothedMaxAcceleration) * SMOOTHING;
    }


    private handleCollisions() {
        for (let i = 0; i < this.bodies.length; i++) {
            for (let j = i + 1; j < this.bodies.length; j++) {
                const a = this.bodies[i];
                const b = this.bodies[j];

                this.solveCollision(a, b);
            }
        }
    }

    private solveCollision(a: Body, b: Body) {
        let manifold: CollisionManifold | null = null;
        
        if (a.shapeType === ShapeType.Circle && b.shapeType === ShapeType.Circle)
            manifold = Collision.CircleVsCircle(a, b);
        else
            manifold = Collision.SAT(a, b);

        if (manifold) {
            Resolution.resolve(a, b, manifold);
        }
    }
}
