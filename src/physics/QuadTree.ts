import { Vec2 } from "../math/Vec2";
import { AABB, Collision } from "./Collision";
import { Body } from "./Body";

export class QuadTree {
    center: Vec2;
    halfSize: Vec2;

    body: Body | null = null;
    count: number = 0;

    mass: number = 0;
    invMass: number = 0;
    COM: Vec2 = new Vec2();

    ne: QuadTree | null = null;
    nw: QuadTree | null = null;
    se: QuadTree | null = null;
    sw: QuadTree | null = null;

    constructor(center: Vec2, halfSize: Vec2) {
        this.center = center;
        this.halfSize = halfSize;
    }

    private subdivide() {
        if (this.ne !== null) return;

        const { x, y } = this.center;
        const { x: w, y: h } = this.halfSize;
        const hs = this.halfSize.clone().scale(0.5);

        this.ne = new QuadTree(new Vec2(x + w * 0.5, y - h * 0.5), hs);
        this.nw = new QuadTree(new Vec2(x - w * 0.5, y - h * 0.5), hs);
        this.se = new QuadTree(new Vec2(x + w * 0.5, y + h * 0.5), hs);
        this.sw = new QuadTree(new Vec2(x - w * 0.5, y + h * 0.5), hs);
    }

    private contains(aabb: AABB): boolean {
        return (
            aabb.min.x >= this.center.x - this.halfSize.x &&
            aabb.max.x <= this.center.x + this.halfSize.x &&
            aabb.min.y >= this.center.y - this.halfSize.y &&
            aabb.max.y <= this.center.y + this.halfSize.y
        );
    }

    insert(body: Body): boolean {
        const aabb = Collision.computeAABB(body);
        if (!this.contains(aabb)) return false;

        const totalMass = this.mass + body.mass;
        if (totalMass > 0) {
            this.COM.x = (this.COM.x * this.mass + body.position.x * body.mass) / totalMass;
            this.COM.y = (this.COM.y * this.mass + body.position.y * body.mass) / totalMass;
        }
        this.mass = totalMass;
        this.invMass = this.mass === 0 ? 0 : 1 / this.mass;
        this.count++;

        // --- Leaf node ---
        if (this.body === null && this.ne === null) {
            this.body = body;
            return true;
        }

        // --- Subdivide if needed ---
        if (this.ne === null) {
            this.subdivide();
            const old = this.body!;
            this.body = null;
            this.insertIntoChildren(old);
        }

        return this.insertIntoChildren(body);
    }

    private insertIntoChildren(body: Body): boolean {
        return (
            this.ne!.insert(body) ||
            this.nw!.insert(body) ||
            this.se!.insert(body) ||
            this.sw!.insert(body)
        );
    }

    computeForce(target: Body, theta: number, G: number, softening: number) {
        if (this.count === 0) return;
        if (this.body === target && this.count === 1) return;

        const dx = this.COM.x - target.position.x;
        const dy = this.COM.y - target.position.y;
        const distSq = dx * dx + dy * dy + softening;
        const dist = Math.sqrt(distSq);

        const s = this.halfSize.x * 2;

        // --- Barnes–Hut approximation ---
        if (this.ne === null || (s / dist) < theta) {
            const forceMag = G * target.mass * this.mass / distSq;
            const invDist = 1 / dist;

            target.force.x += dx * forceMag * invDist;
            target.force.y += dy * forceMag * invDist;
            return;
        }

        // --- Otherwise recurse ---
        this.ne!.computeForce(target, theta, G, softening);
        this.nw!.computeForce(target, theta, G, softening);
        this.se!.computeForce(target, theta, G, softening);
        this.sw!.computeForce(target, theta, G, softening);
    }
}
