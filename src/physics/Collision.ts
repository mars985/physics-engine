import { Vec2 } from "../math/Vec2.js";
import { Body } from "./Body.js";

export class CollisionManifold {
    public readonly normal: Vec2;
    public readonly penetration: number;

    constructor(n = new Vec2(0, 0), p = 0) {
        this.normal = n;
        this.penetration = p;
    }
}

export class Collision {
    static pointVsAABB(point: Vec2, body: Body): boolean {
        const minX = body.position.x - body.size.x / 2;
        const maxX = body.position.x + body.size.x / 2;
        const minY = body.position.y - body.size.y / 2;
        const maxY = body.position.y + body.size.y / 2;

        return (
            point.x >= minX &&
            point.x <= maxX &&
            point.y >= minY &&
            point.y <= maxY
        );
    }

    static AABBvsAABB(a: Body, b: Body): CollisionManifold | null {
        const aMinX = a.position.x - a.size.x / 2;
        const aMaxX = a.position.x + a.size.x / 2;
        const aMinY = a.position.y - a.size.y / 2;
        const aMaxY = a.position.y + a.size.y / 2;

        const bMinX = b.position.x - b.size.x / 2;
        const bMaxX = b.position.x + b.size.x / 2;
        const bMinY = b.position.y - b.size.y / 2;
        const bMaxY = b.position.y + b.size.y / 2;

        // Check overlap
        const overlapX = Math.min(aMaxX, bMaxX) - Math.max(aMinX, bMinX);
        const overlapY = Math.min(aMaxY, bMaxY) - Math.max(aMinY, bMinY);

        if (overlapX <= 0 || overlapY <= 0) {
            return null; // No collision
        }

        // Find axis of least penetration
        if (overlapX < overlapY) {
            // If A is to the left of B, the normal pointing from A to B is (1, 0)
            const normalX = a.position.x < b.position.x ? 1 : -1;
            return new CollisionManifold(new Vec2(normalX, 0), overlapX);
        } else {
            // If A is above B, the normal pointing from A to B is (0, 1)
            const normalY = a.position.y < b.position.y ? 1 : -1;
            return new CollisionManifold(new Vec2(0, normalY), overlapY);
        }
    }

    static CircleVsCircle(a: Body, b: Body) {
        const dx = b.position.x - a.position.x;
        const dy = b.position.y - a.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const r = a.radius + b.radius;

        if (distance >= r) return null;

        const normal = distance !== 0 ?
            new Vec2(dx / distance, dy / distance) :
            new Vec2(0, 1);
        const penetration = r - distance;
        return new CollisionManifold(normal, penetration);
    }

    static CircleVsAABB(circle: Body, box: Body): CollisionManifold | null {
        const bMinX = box.position.x - box.size.x / 2;
        const bMaxX = box.position.x + box.size.x / 2;
        const bMinY = box.position.y - box.size.y / 2;
        const bMaxY = box.position.y + box.size.y / 2;

        // Find the closest point on the AABB to the circle center
        const closestX = Math.max(bMinX, Math.min(circle.position.x, bMaxX));
        const closestY = Math.max(bMinY, Math.min(circle.position.y, bMaxY));

        const dx = circle.position.x - closestX;
        const dy = circle.position.y - closestY;
        const distanceSq = dx * dx + dy * dy;

        if (distanceSq >= circle.radius * circle.radius) return null;

        const distance = Math.sqrt(distanceSq);
        let normal: Vec2;
        let penetration: number;

        if (distance !== 0) {
            normal = new Vec2(dx / distance, dy / distance);
            penetration = circle.radius - distance;
        } else {
            normal = new Vec2(0, 1);
            penetration = circle.radius;
        }

        return new CollisionManifold(normal, penetration);
    }
}
