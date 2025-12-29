export class Vec2 {
    constructor(public x = 0, public y = 0) { }

    clone(): Vec2 {
        return new Vec2(this.x, this.y);
    }

    add(v: Vec2) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }
    sub(v: Vec2) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }
    multiply(v: Vec2) {
        this.x *= v.x;
        this.y *= v.y;
        return this;
    }
    scale(s: number) {
        this.x *= s;
        this.y *= s;
        return this;
    }
    dot(v: Vec2) {
        return this.x * v.x + this.y * v.y;
    }
    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    normalize() {
        const mag = this.magnitude();
        if (mag > 0) {
            this.x /= mag;
            this.y /= mag;
        }
        return this;
    }

    static add(a: Vec2, b: Vec2) {
        return new Vec2(a.x + b.x, a.y + b.y);
    }
}