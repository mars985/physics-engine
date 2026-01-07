import { Body, ShapeType } from "../physics/Body.js";
import { Resolution } from "../physics/Resolution.js";
import { Vec2 } from "../math/Vec2.js";
import { Collision, CollisionManifold } from "../physics/Collision.js";
import { QuadTree } from "../physics/QuadTree.js";

export class World {
    bodies: Body[] = [];
    private grid: Map<string, Body[]> = new Map();
    cellSize = 150;

    gravity = new Vec2();
    damping = 1;

    enable_collisions = false;
    enable_mutual_gravity = false;
    enable_movable_mutual_gravity = false;

    maxAcceleration = 0;        // current frame
    smoothedMaxAcceleration = 1; // for visualization

    customCallback!: Function | null;

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
        this.customCallback = null;
    }

    step(dt: number) {
        this.grid = Collision.spacePartitioning(this.bodies, this.cellSize);

        if (this.enable_mutual_gravity || this.enable_movable_mutual_gravity)
            this.applyMutualGravity();

        this.integrateBodies(dt);

        if (this.enable_collisions)
            this.handleCollisions();

        if (this.customCallback != null)
            this.customCallback(dt);
    }

    private applyMutualGravity() {
        if (!this.enable_mutual_gravity) return;

        const G = 100;
        const softening = 25;
        const theta = 0.7;

        // Build QuadTree
        const root = new QuadTree(
            new Vec2(0, 0),
            new Vec2(2000, 2000)
        );

        for (const body of this.bodies) {
            // Same filtering as before
            if (!body.movable || this.enable_movable_mutual_gravity) {
                root.insert(body);
            }
        }

        // Apply forces
        for (const body of this.bodies) {
            if (!body.movable && !this.enable_movable_mutual_gravity) continue;
            root.computeForce(body, theta, G, softening);
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
        for (const cell of this.grid.values()) {
            for (let i = 0; i < cell.length; i++) {
                for (let j = i + 1; j < cell.length; j++) {
                    const a = cell[i];
                    const b = cell[j];

                    this.solveCollision(a, b);
                }
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
