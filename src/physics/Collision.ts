import { Vec2 } from "../math/Vec2";

export class CollisionManifold {
    public readonly normal: Vec2;
    public readonly penetration: number;
    
    constructor(n = new Vec2(0, 0), p = 0) {
        this.normal = n;
        this.penetration = p;
    }
}