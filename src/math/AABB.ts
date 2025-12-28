import { Vec2 } from "./Vec2";
import { Body } from "../physics/Body";
import { CollisionManifold } from "../physics/Collision";

export class AABB {
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
            const normalX = a.position.x < b.position.x ? -1 : 1;
            return new CollisionManifold(
                new Vec2(normalX, 0),
                overlapX
            );
        } else {
            const normalY = a.position.y < b.position.y ? -1 : 1;
            return new CollisionManifold(
                new Vec2(0, normalY),
                overlapY
            );
        }
    }
}
