import { Vec2 } from '../math/Vec2.js'

export enum ShapeType { Circle, Polygon };

export interface BodyOptions {
    x: number;
    y: number;

    // Polygon
    vertices?: Vec2[];
    w?: number;
    h?: number;

    // Circle
    r?: number;

    mass?: number;
    vx?: number;
    vy?: number;
    angv?: number;
    incline?: number;
    restitution?: number;
    color?: string;
    movable?: boolean;
    shapeType: ShapeType;
}

export class Body {
    position: Vec2;
    linear_velocity: Vec2;
    angular_velocity: number;
    incline: number;

    vertices: Vec2[] = []; // local-space
    radius = 0;

    mass: number;
    invMass: number;
    inertia: number;
    invInertia: number;
    restitution: number;

    shapeType: ShapeType;
    color: string;
    movable: boolean;

    force = new Vec2(0, 0);
    id = performance.now();

    constructor(options: BodyOptions) {
        const {
            x, y,
            vertices,
            w = 50,
            h = 50,
            r = 20,
            mass = 1,
            vx = 0,
            vy = 0,
            angv = 0,
            incline = 0,
            restitution = 1,
            color = "white",
            movable = true,
            shapeType
        } = options;

        this.position = new Vec2(x, y);
        this.linear_velocity = new Vec2(vx, vy);
        this.angular_velocity = angv;
        this.incline = incline;

        this.mass = mass;
        this.invMass = mass === 0 ? 0 : 1 / mass;
        this.restitution = restitution;

        this.shapeType = shapeType;
        this.color = color;
        this.movable = movable;

        if (shapeType === ShapeType.Polygon) {
            if (vertices && vertices.length >= 3) {
                this.vertices = vertices;
            } else {
                this.vertices = this.createBoxVertices(w, h);
            }

            this.inertia = this.computeInertia();
        } else {
            this.radius = r;
            // Circle inertia: I = 0.5 * m * r^2
            this.inertia = 0.5 * mass * r * r;
        }

        this.invInertia = this.inertia === 0 ? 0 : 1 / this.inertia;
    }

    integrate(dt: number, damping = 1) {
        if (!this.movable) return;
        const accelerationX = this.force.x * this.invMass;
        const accelerationY = this.force.y * this.invMass;

        this.linear_velocity.x += accelerationX * dt;
        this.linear_velocity.y += accelerationY * dt;

        this.incline += this.angular_velocity * dt;

        this.position.x += this.linear_velocity.x * dt;
        this.position.y += this.linear_velocity.y * dt;

        this.linear_velocity.x *= damping;
        this.linear_velocity.y *= damping;
        this.angular_velocity *= damping;

        this.force.x = 0;
        this.force.y = 0;

        const velocityLimit = 900;
        const speed = this.linear_velocity.magnitude();
        if (speed > velocityLimit) {
            this.linear_velocity.scale(velocityLimit / speed);
        }
    }

    getWorldVertices(): Vec2[] {
        const cos = Math.cos(this.incline);
        const sin = Math.sin(this.incline);

        // rotation
        return this.vertices.map(v =>
            new Vec2(
                v.x * cos - v.y * sin + this.position.x,
                v.x * sin + v.y * cos + this.position.y
            )
        );
    }

    static createRegularPolygon(
        sides: number,
        radius: number,
        rotation = 0
    ): Vec2[] {
        if (sides < 3) {
            throw new Error("Polygon must have at least 3 sides");
        }

        const vertices: Vec2[] = [];
        const step = (Math.PI * 2) / sides;

        for (let i = 0; i < sides; i++) {
            const angle = i * step + rotation;
            vertices.push(
                new Vec2(
                    Math.cos(angle) * radius,
                    Math.sin(angle) * radius
                )
            );
        }

        return vertices;
    }

    private createBoxVertices(w: number, h: number): Vec2[] {
        const hw = w / 2;
        const hh = h / 2;

        return [
            new Vec2(-hw, -hh),
            new Vec2(hw, -hh),
            new Vec2(hw, hh),
            new Vec2(-hw, hh),
        ];
    }

    private computeInertia(): number {
        // Approximate inertia for polygon using bounding box
        let minX = this.vertices[0].x, maxX = this.vertices[0].x;
        let minY = this.vertices[0].y, maxY = this.vertices[0].y;
        for (const v of this.vertices) {
            if (v.x < minX) minX = v.x;
            if (v.x > maxX) maxX = v.x;
            if (v.y < minY) minY = v.y;
            if (v.y > maxY) maxY = v.y;
        }
        const width = maxX - minX;
        const height = maxY - minY;
        return (1 / 12) * this.mass * (width * width + height * height); // approximate
    }
}
