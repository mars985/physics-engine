import { Vec2 } from "../math/Vec2.js";
import { Body, ShapeType } from "./Body.js";

export class CollisionManifold {
    constructor(
        public readonly normal: Vec2,
        public readonly penetration: number,
        public readonly contactPoint: Vec2
    ) { }
}

export type AABB = {
    min: Vec2;
    max: Vec2;
};

export class Collision {

    /* ===================== Broad Phase ===================== */

    static computeAABB(body: Body): AABB {
        if (body.shapeType === ShapeType.Circle) {
            const r = body.radius!;
            return {
                min: new Vec2(body.position.x - r, body.position.y - r),
                max: new Vec2(body.position.x + r, body.position.y + r),
            };
        }

        const verts = body.getWorldVertices();
        let minX = verts[0].x, maxX = verts[0].x;
        let minY = verts[0].y, maxY = verts[0].y;

        for (const v of verts) {
            minX = Math.min(minX, v.x);
            maxX = Math.max(maxX, v.x);
            minY = Math.min(minY, v.y);
            maxY = Math.max(maxY, v.y);
        }

        return {
            min: new Vec2(minX, minY),
            max: new Vec2(maxX, maxY),
        };
    }

    static spacePartitioning(bodies: Body[], cellSize = 100) {
        const grid = new Map<string, Body[]>();

        function cellKey(x: number, y: number) {
            return `${x},${y}`;
        }

        for (const body of bodies) {
            const aabb = this.computeAABB(body);

            const minCellX = Math.floor(aabb.min.x / cellSize);
            const minCellY = Math.floor(aabb.min.y / cellSize);
            const maxCellX = Math.floor(aabb.max.x / cellSize);
            const maxCellY = Math.floor(aabb.max.y / cellSize);

            for (let x = minCellX; x <= maxCellX; x++) {
                for (let y = minCellY; y <= maxCellY; y++) {
                    const key = cellKey(x, y);
                    if (!grid.has(key)) {
                        grid.set(key, []);
                    }
                    grid.get(key)!.push(body);
                }
            }
        }

        return grid;
    }

    /* ===================== Narrow Phase ===================== */

    static pointVsAABB(point: Vec2, body: Body): boolean {
        const { min, max } = this.computeAABB(body);
        return (
            point.x >= min.x && point.x <= max.x &&
            point.y >= min.y && point.y <= max.y
        );
    }

    static AABBvsAABB(a: Body, b: Body): CollisionManifold | null {
        const A = this.computeAABB(a);
        const B = this.computeAABB(b);

        const overlapX = Math.min(A.max.x, B.max.x) - Math.max(A.min.x, B.min.x);
        const overlapY = Math.min(A.max.y, B.max.y) - Math.max(A.min.y, B.min.y);

        if (overlapX <= 0 || overlapY <= 0) return null;

        if (overlapX < overlapY) {
            const nx = a.position.x < b.position.x ? 1 : -1;
            return new CollisionManifold(new Vec2(nx, 0), overlapX, new Vec2());
        } else {
            const ny = a.position.y < b.position.y ? 1 : -1;
            return new CollisionManifold(new Vec2(0, ny), overlapY, new Vec2());
        }
    }

    /* ===================== CIRCLE ===================== */

    static CircleVsCircle(a: Body, b: Body): CollisionManifold | null {
        const delta = b.position.clone().sub(a.position);
        const dist = delta.magnitude();
        const r = a.radius! + b.radius!;

        if (dist >= r) return null;

        const normal = dist !== 0 ? delta.scale(1 / dist) : new Vec2(0, 1);
        const penetration = r - dist;
        const contact = a.position.clone().add(normal.clone().scale(a.radius!));

        return new CollisionManifold(normal, penetration, contact);
    }

    static CircleVsAABB(circle: Body, box: Body): CollisionManifold | null {
        const { min, max } = this.computeAABB(box);

        const cx = Math.max(min.x, Math.min(circle.position.x, max.x));
        const cy = Math.max(min.y, Math.min(circle.position.y, max.y));

        const dx = circle.position.x - cx;
        const dy = circle.position.y - cy;

        const distSq = dx * dx + dy * dy;
        const r = circle.radius!;

        if (distSq >= r * r) return null;

        const dist = Math.sqrt(distSq);
        const normal = dist !== 0 ? new Vec2(dx / dist, dy / dist) : new Vec2(0, 1);
        const penetration = r - dist;

        return new CollisionManifold(normal, penetration, new Vec2(cx, cy));
    }

    /* ===================== SAT ===================== */

    static SAT(a: Body, b: Body): CollisionManifold | null {
        const axes: Vec2[] = [];

        if (a.shapeType === ShapeType.Polygon)
            axes.push(...getAxes(a.getWorldVertices()));

        if (b.shapeType === ShapeType.Polygon)
            axes.push(...getAxes(b.getWorldVertices()));

        // Circle–Polygon axis
        if (a.shapeType === ShapeType.Circle && b.shapeType === ShapeType.Polygon) {
            const p = closestPointOnPolygon(b.getWorldVertices(), a.position);
            const axis = a.position.clone().sub(p);
            if (axis.magnitude() > 0) axes.push(axis.normalize());
        }

        if (b.shapeType === ShapeType.Circle && a.shapeType === ShapeType.Polygon) {
            const p = closestPointOnPolygon(a.getWorldVertices(), b.position);
            const axis = b.position.clone().sub(p);
            if (axis.magnitude() > 0) axes.push(axis.normalize());
        }

        // Circle–Circle axis
        if (a.shapeType === ShapeType.Circle && b.shapeType === ShapeType.Circle) {
            const axis = b.position.clone().sub(a.position);
            axes.push(axis.magnitude() === 0 ? new Vec2(0, 1) : axis.normalize());
        }

        let minOverlap = Infinity;
        let bestAxis: Vec2 | null = null;

        for (const axis of axes) {
            const pA = projectShape(a, axis);
            const pB = projectShape(b, axis);

            const overlap = Math.min(pA.max, pB.max) - Math.max(pA.min, pB.min);
            if (overlap <= 0) return null;

            if (overlap < minOverlap) {
                minOverlap = overlap;
                bestAxis = axis;
            }
        }

        // Ensure normal points A → B
        if (bestAxis!.dot(b.position.clone().sub(a.position)) < 0) {
            bestAxis!.scale(-1);
        }

        const contact = computeContactPoint(a, b, bestAxis!);
        return new CollisionManifold(bestAxis!, minOverlap, contact);
    }
}

/* ===================== HELPERS ===================== */

function getAxes(vertices: Vec2[]): Vec2[] {
    const axes: Vec2[] = [];
    for (let i = 0; i < vertices.length; i++) {
        const edge = vertices[(i + 1) % vertices.length].clone().sub(vertices[i]);
        axes.push(new Vec2(-edge.y, edge.x).normalize());
    }
    return axes;
}

function project(vertices: Vec2[], axis: Vec2) {
    let min = vertices[0].dot(axis);
    let max = min;

    for (let i = 1; i < vertices.length; i++) {
        const p = vertices[i].dot(axis);
        min = Math.min(min, p);
        max = Math.max(max, p);
    }
    return { min, max };
}

function projectShape(body: Body, axis: Vec2) {
    if (body.shapeType === ShapeType.Circle) {
        const c = body.position.dot(axis);
        return { min: c - body.radius!, max: c + body.radius! };
    }
    return project(body.getWorldVertices(), axis);
}

function getFarthestVertex(vertices: Vec2[], dir: Vec2): Vec2 {
    let best = vertices[0];
    let max = best.dot(dir);

    for (const v of vertices) {
        const d = v.dot(dir);
        if (d > max) {
            max = d;
            best = v;
        }
    }
    return best.clone();
}

function computeContactPoint(a: Body, b: Body, normal: Vec2): Vec2 {
    if (a.shapeType === ShapeType.Circle)
        return a.position.clone().add(normal.clone().scale(a.radius!));

    if (b.shapeType === ShapeType.Circle)
        return b.position.clone().sub(normal.clone().scale(b.radius!));

    const va = getFarthestVertex(a.getWorldVertices(), normal);
    const vb = getFarthestVertex(b.getWorldVertices(), normal.clone().scale(-1));
    return va.add(vb).scale(0.5);
}

function closestPointOnPolygon(vertices: Vec2[], point: Vec2): Vec2 {
    let closest = vertices[0];
    let minDistSq = Infinity;

    for (let i = 0; i < vertices.length; i++) {
        const a = vertices[i];
        const b = vertices[(i + 1) % vertices.length];

        const ab = b.clone().sub(a);
        const t = Math.max(0, Math.min(1, point.clone().sub(a).dot(ab) / ab.dot(ab)));
        const proj = a.clone().add(ab.scale(t));

        const d = proj.clone().sub(point).magnitude();
        if (d * d < minDistSq) {
            minDistSq = d * d;
            closest = proj;
        }
    }
    return closest;
}
