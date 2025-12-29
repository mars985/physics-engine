import { Body, ShapeType } from "../physics/Body";
import { Resolution } from "../physics/Resolution";
import { Vec2 } from "../math/Vec2";
import { Collision, CollisionManifold } from "../physics/Collision";


export class World {
    bodies: Body[] = [];
    gravity = new Vec2(0, 600);

    enable_collisions = false;
    enable_mutual_gravity = false;

    maxAcceleration = 0;        // current frame
    smoothedMaxAcceleration = 1; // for visualization

    add(body: Body) {
        this.bodies.push(body);
    }

    step(dt: number) {
        if (this.enable_mutual_gravity)
            this.applyMutualGravity();   // Objects pulling each other

        this.integrateBodies(dt);      // Move objects based on velocity

        if (this.enable_collisions)
            this.handleCollisions();       // Optional: prevent overlapping
    }

    private applyMutualGravity() {
        const G = 100;
        const softening = 25;
        let i = 0;
        while (i < this.bodies.length && !this.bodies[i].movable) {
        // for (i = 0; i < this.bodies.length; i++) {
            for (let j = i + 1; j < this.bodies.length; j++) {
                const a = this.bodies[i];
                const b = this.bodies[j];

                const delta = b.position.clone().sub(a.position);
                const distSq = delta.x * delta.x + delta.y * delta.y + softening;
                const dist = Math.sqrt(distSq);

                const MAX_RANGE = 100000;
                const maxDistSq = MAX_RANGE * MAX_RANGE;
                if (distSq > maxDistSq) continue;

                const invDist = 1 / Math.sqrt(distSq);
                const forceMag = G * a.mass * b.mass * invDist * invDist;
                const force = delta.scale(forceMag / dist);

                a.force.add(force);
                b.force.sub(force);
            }
            i++;
        }
    }

    private integrateBodies(dt: number) {
        let frameMaxAcc = 0;

        for (const body of this.bodies) {
            if (!body.movable || body.mass === 0) continue;

            const ax = body.force.x * body.invMass;
            const ay = body.force.y * body.invMass;

            const acc = Math.sqrt(ax * ax + ay * ay);
            frameMaxAcc = Math.max(frameMaxAcc, acc);

            body.integrate(dt);
        }

        // Smooth it to avoid flickering colors
        const SMOOTHING = 0.1;
        this.smoothedMaxAcceleration +=
            (frameMaxAcc - this.smoothedMaxAcceleration) * SMOOTHING;
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
        let manifold = null;
        if (a.shapeType === ShapeType.Box && b.shapeType === ShapeType.Box)
            manifold = Collision.AABBvsAABB(a, b);
        else if (a.shapeType === ShapeType.Circle && b.shapeType === ShapeType.Circle)
            manifold = Collision.CircleVsCircle(a, b);
        else if (a.shapeType === ShapeType.Box && b.shapeType === ShapeType.Circle)
            manifold = Collision.CircleVsAABB(b, a);

        if (manifold) {
            Resolution.resolve(a, b, manifold);
        }
    }
}
