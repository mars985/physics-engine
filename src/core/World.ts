import { Body, ShapeType } from "../physics/Body";
import { Resolution } from "../physics/Resolution";
import { Vec2 } from "../math/Vec2";
import { Collision, CollisionManifold } from "../physics/Collision";


export class World {
    bodies: Body[] = [];
    gravity = new Vec2(0, 600);

    add(body: Body) {
        this.bodies.push(body);
    }

    step(dt: number) {
        // integrate motion
        for (const body of this.bodies) {
            if (body.mass !== 0)
                body.integrate(dt, this.gravity);
        }

        // collision detection
        for (let i = 0; i < this.bodies.length; i++) {
            for (let j = i + 1; j < this.bodies.length; j++) {
                const a = this.bodies[i];
                const b = this.bodies[j];

                this.solveCollision(a, b);
            }
        }
    }
    
    private solveCollision(a: Body, b: Body) {
        let manifold = null;
        if (a.shapeType === ShapeType.Box && b.shapeType === ShapeType.Box)
            manifold = Collision.AABBvsAABB(a, b);
        else if (a.shapeType === ShapeType.Circle && b.shapeType === ShapeType.Circle)
            manifold = Collision.CircleVsCircle(a, b);
        else if (a.shapeType === ShapeType.Box && b.shapeType === ShapeType.Circle)
            manifold = Collision.CircleVsAABB(b, a);

        if (manifold) {
            Resolution.resolve(a, b, manifold);
        }
    }
}
