import { Body, ShapeType } from "../physics/Body.js";
import { Resolution } from "../physics/Resolution.js";
import { Vec2 } from "../math/Vec2.js";
import { Collision, CollisionManifold } from "../physics/Collision.js";
import { QuadTree } from "../physics/QuadTree.js";
import { Boid } from "../boids/Boid.js";

export class World {
    bodies: Body[] = [];
    grid: Map<string, Body[]> = new Map();
    cellSize = 150;

    boids: Boid[] = [];
    boidBodies: Body[] = [];

    gravity = new Vec2();
    damping = 1;
    angular_damping = 1;

    enable_collisions = false;
    enable_mutual_gravity = false;
    enable_movable_mutual_gravity = false;

    maxAcceleration = 0;        // current frame
    smoothedMaxAcceleration = 1; // for visualization

    customCallback!: Function | null;

    clear() {
        this.bodies.length = 0;
        this.boids.length = 0;
        this.boidBodies.length = 0;
        this.enable_collisions = false;
        this.enable_mutual_gravity = false;
        this.enable_movable_mutual_gravity = false;
        this.gravity.x = 0;
        this.gravity.y = 0;
        this.customCallback = null;
    }

    addBody(body: Body): void;
    addBody(...bodies: Body[]): void;
    addBody(...bodies: Body[]): void {
        this.bodies.push(...bodies);
    }

    removeBody(index: number) {
        this.bodies.splice(index, 1);
    }

    addBoid(boid: Boid): void;
    addBoid(...boids: Boid[]): void;
    addBoid(...boids: Boid[]): void {
        this.boids.push(...boids);
        this.boidBodies.push(...boids.map((boid) => boid.body));
    }

    removeBoid(index: number) {
        this.boids.splice(index, 1);
        this.boidBodies.splice(index, 1);
    }

    step(dt: number) {
        this.grid = Collision.spacePartitioning(
            [
                ...this.bodies,
                // ...this.boidBodies
            ],
            this.cellSize
        );

        if (this.enable_mutual_gravity || this.enable_movable_mutual_gravity)
            this.applyMutualGravity();
        
        // Boid.applySeparation(this.boids);
        // Boid.applyAlignment(this.boids);
        // Boid.applyCohesion(this.boids);
        Boid.applyRules(this.boids);
        Boid.applyObstacleAvoidance(this.boids, this.bodies);

        this.integrateBodies(dt);        
        
        Boid.limitSpeed(this.boids);
        Boid.rotateBoids(this.boids);

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

        for (const body of [...this.bodies, ...this.boidBodies]) {
            if (!body.movable || body.mass === 0) continue;
            body.force.add(this.gravity.clone().scale(body.mass));

            const ax = body.force.x * body.invMass;
            const ay = body.force.y * body.invMass;

            const acc = Math.hypot(ax, ay);
            frameMaxAcc = Math.max(frameMaxAcc, acc);

            body.integrate(dt, this.damping, this.angular_damping);
        }

        // Smooth it to avoid flickering colors
        const SMOOTHING = 0.1;
        this.smoothedMaxAcceleration += (frameMaxAcc - this.smoothedMaxAcceleration) * SMOOTHING;
    }

    private handleCollisions() {
        const processed = new Set<number>();

        for (const cell of this.grid.values()) {
            for (let i = 0; i < cell.length; i++) {
                for (let j = i + 1; j < cell.length; j++) {
                    const a = cell[i];
                    const b = cell[j];

                    // Cantor pairing — unique key for each unordered pair
                    const lo = Math.min(a.id, b.id);
                    const hi = Math.max(a.id, b.id);
                    const key = (lo + hi) * (lo + hi + 1) / 2 + hi;
                    if (processed.has(key)) continue;
                    processed.add(key);

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
            Resolution.resolveWithRotation(a, b, manifold);
        }
    }
}
