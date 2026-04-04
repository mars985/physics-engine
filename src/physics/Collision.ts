import { Vec2 } from "../math/Vec2.js";
import { Body, ShapeType } from "./Body.js";

export class CollisionManifold {
    constructor(
        public readonly normal: Vec2,
        public readonly penetration: number,
        public readonly contactList: Vec2[]
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

    static CircleVsCircle(a: Body, b: Body): CollisionManifold | null {
        const delta = b.position.clone().sub(a.position);
        const dist = delta.magnitude();
        const r = a.radius! + b.radius!;

        if (dist >= r) return null;

        const normal = dist !== 0 ? delta.scale(1 / dist) : new Vec2(0, 1);
        const penetration = r - dist;
        return new CollisionManifold(normal, penetration, computeContactPoints(a, b, normal));
    }

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

        const contact = computeContactPoints(a, b, bestAxis!);
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

function computeContactPoints(
    a: Body,
    b: Body,
    normal: Vec2
): Vec2[] {

    if (a.shapeType === ShapeType.Circle ||
        b.shapeType === ShapeType.Circle) {
        return circleContact(a, b, normal);
    }

    return polygonContact(a, b, normal);
}
function polygonContact(
    a: Body,
    b: Body,
    normal: Vec2
): Vec2[] {
    const vertsA = a.getWorldVertices();
    const vertsB = b.getWorldVertices();

    // Reference & incident faces
    const ref = getReferenceFace(vertsA, normal);
    const inc = getReferenceFace(vertsB, normal.clone().scale(-1));

    let points = [inc.v1, inc.v2];

    // Reference edge direction
    const refEdge = ref.v2.clone().sub(ref.v1).normalize();
    const refNormal = new Vec2(refEdge.y, -refEdge.x);

    const offset = refNormal.dot(ref.v1);

    // Clip against reference face side planes
    points = clip(points, refEdge.clone().scale(-1), -refEdge.dot(ref.v1));
    if (points.length < 2) return [];

    points = clip(points, refEdge, refEdge.dot(ref.v2));
    if (points.length < 2) return [];

    // Keep only points behind reference face
    return points.filter(p => refNormal.dot(p) - offset <= 0);
}
function clip(
    points: Vec2[],
    normal: Vec2,
    offset: number
): Vec2[] {
    const out: Vec2[] = [];

    const d0 = normal.dot(points[0]) - offset;
    const d1 = normal.dot(points[1]) - offset;

    if (d0 >= 0) out.push(points[0]);
    if (d1 >= 0) out.push(points[1]);

    if (d0 * d1 < 0) {
        const t = d0 / (d0 - d1);
        out.push(points[0].add(points[1].clone().sub(points[0]).clone().scale(t)));
    }

    return out;
}
function getReferenceFace(vertices: Vec2[], normal: Vec2) {
    let bestDot = -Infinity;
    let index = 0;

    for (let i = 0; i < vertices.length; i++) {
        const va = vertices[i];
        const vb = vertices[(i + 1) % vertices.length];
        const edge = vb.clone().sub(va);
        const edgeNormal = new Vec2(edge.y, -edge.x).normalize();

        const dot = edgeNormal.dot(normal);
        if (dot > bestDot) {
            bestDot = dot;
            index = i;
        }
    }

    return {
        v1: vertices[index],
        v2: vertices[(index + 1) % vertices.length],
    };
}
function circleContact(a: Body, b: Body, normal: Vec2): Vec2[] {
    if (a.shapeType === ShapeType.Circle) {
        return [
            a.position.clone().add(
                normal.clone().scale(a.radius! - 0.001)
            )
        ];
    }

    return [
        b.position.clone().sub(
            normal.clone().scale(b.radius! - 0.001)
        )
    ];
}

export function closestPointOnPolygon(vertices: Vec2[], point: Vec2): Vec2 {
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
