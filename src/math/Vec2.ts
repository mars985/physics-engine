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
    scale(v: Vec2) {
        this.x *= v.x;
        this.y *= v.y;
        return this;
    }
    static add(a: Vec2, b: Vec2) {
        return new Vec2(a.x + b.x, a.y + b.y);
    }
}