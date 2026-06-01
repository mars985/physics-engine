import { Vec2 } from "../math/Vec2";
import { Body, ShapeType } from "../physics/Body";
import { closestPointOnPolygon } from "../physics/Collision";

export interface BoidOptions {
    body: Body;
    viewAngle?: number;
    perceptionRadius?: number;
    speed?: Vec2;
}

export class Boid {
    body: Body;
    viewAngle: number;
    perceptionRadius: number;
    perceptionRadiusSq: number;
    cosHalfFOV: number;
    cosHalfFOVSq: number;

    speed: Vec2;
    speedSq: Vec2;

    constructor(options: BoidOptions) {
        const { body, viewAngle = 240, perceptionRadius = 75, speed = new Vec2(100, 150) } = options;
        this.body = body;

        this.viewAngle = viewAngle;

        this.perceptionRadius = perceptionRadius;
        this.perceptionRadiusSq = this.perceptionRadius * this.perceptionRadius;

        this.cosHalfFOV = Math.cos(this.viewAngle * 0.5 * Math.PI / 180);
        this.cosHalfFOVSq = this.cosHalfFOV * this.cosHalfFOV;

        this.speed = speed;
        this.speedSq = this.speed.clone().multiply(this.speed);
    }

    static isVisible(currentBoid: Boid, otherBoid: Boid): boolean {
        const toOther = Vec2.sub(otherBoid.body.position, currentBoid.body.position);
        const distSq = toOther.magnitudeSq();

        if (distSq <= currentBoid.perceptionRadiusSq) {
            const dot = currentBoid.body.linear_velocity.dot(toOther);

            if (dot > 0) {
                if (dot * dot >= currentBoid.body.linear_velocity.magnitudeSq() * distSq * currentBoid.cosHalfFOVSq) {
                    return true;
                }
            }
        }
        return false;
    }

    static applySeparation(boids: Boid[]) {
        for (let i = 0; i < boids.length; i++) {
            const b1 = boids[i];

            for (let j = 0; j < boids.length; j++) {
                if (i === j) continue;
                const b2 = boids[j];

                if (this.isVisible(b1, b2)) {
                    const toOther = Vec2.sub(b2.body.position, b1.body.position);
                    const distSq = toOther.magnitudeSq();

                    const strength = 30000 / (distSq + 10);
                    const force = toOther.normalize().scale(-strength);

                    b1.body.force.add(force);
                }
            }
        }
    }

    static applyAlignment(boids: Boid[]) {
        for (let i = 0; i < boids.length; i++) {
            const b1 = boids[i];
            const avgVelocity = new Vec2(0, 0);
            let neighborCount = 0;

            for (let j = 0; j < boids.length; j++) {
                if (i === j) continue;
                const b2 = boids[j];

                if (this.isVisible(b1, b2)) {
                    avgVelocity.add(b2.body.linear_velocity);
                    neighborCount++;
                }
            }

            if (neighborCount > 0) {
                avgVelocity.scale(1 / neighborCount);
                avgVelocity.normalize().scale(b1.speed.y);

                const steer = Vec2.sub(avgVelocity, b1.body.linear_velocity);
                steer.scale(0.005);

                b1.body.force.add(steer);
            }
        }
    }

    static applyCohesion(boids: Boid[]) {
        for (let i = 0; i < boids.length; i++) {
            const b1 = boids[i];
            const centerOfMass = new Vec2(0, 0);
            let neighborCount = 0;

            for (let j = 0; j < boids.length; j++) {
                if (i === j) continue;
                const b2 = boids[j];

                if (this.isVisible(b1, b2)) {
                    centerOfMass.add(b2.body.position);
                    neighborCount++;
                }
            }

            if (neighborCount > 0) {
                centerOfMass.scale(1 / neighborCount);

                const desired = Vec2.sub(centerOfMass, b1.body.position);
                desired.normalize().scale(b1.speed.y);

                const steer = Vec2.sub(desired, b1.body.linear_velocity);
                steer.scale(0.1);

                b1.body.force.add(steer);
            }
        }
    }

    static applyRules(boids: Boid[]) {
        const separationStrength = 12000;
        const separationRadiusSq = 70 * 70;
        const alignmentWeight = 0.05;
        const cohesionWeight = 0.03;

        for (let i = 0; i < boids.length; i++) {
            const b1 = boids[i];

            let sepForce = new Vec2(0, 0);
            let aliVel = new Vec2(0, 0);
            let cohPos = new Vec2(0, 0);
            let count = 0;

            for (let j = 0; j < boids.length; j++) {
                if (i === j) continue;
                const b2 = boids[j];

                const toOther = Vec2.sub(b2.body.position, b1.body.position);
                const dSq = toOther.magnitudeSq();

                if (dSq >= b1.perceptionRadiusSq || !this.isVisible(b1, b2)) continue;

                if (dSq < separationRadiusSq) {
                    sepForce.add(toOther.clone().normalize().scale(-separationStrength / (dSq + 1)));
                }

                aliVel.add(b2.body.linear_velocity);
                cohPos.add(b2.body.position);
                count++;
            }

            b1.body.force.add(sepForce);

            if (count > 0) {
                aliVel.scale(1 / count).normalize().scale(b1.speed.y);
                const aliSteer = Vec2.sub(aliVel, b1.body.linear_velocity).scale(alignmentWeight);

                cohPos.scale(1 / count);
                const cohDesired = Vec2.sub(cohPos, b1.body.position).normalize().scale(b1.speed.y);
                const cohSteer = Vec2.sub(cohDesired, b1.body.linear_velocity).scale(cohesionWeight);

                b1.body.force.add(aliSteer);
                b1.body.force.add(cohSteer);
            }
        }
    }

    static applyObstacleAvoidance(boids: Boid[], obstacles: Body[]) {
        const lookAheadDistance = 150;
        const avoidForceScale = 2000;

        for (const boid of boids) {
            for (const obstacle of obstacles) {
                if (boid.body === obstacle) continue;

                let closestPoint: Vec2;

                if (obstacle.shapeType === ShapeType.Circle) {
                    const toBoid = Vec2.sub(boid.body.position, obstacle.position).normalize();
                    closestPoint = obstacle.position.clone().add(toBoid.scale(obstacle.radius!));
                } else {
                    closestPoint = closestPointOnPolygon(obstacle.getWorldVertices(), boid.body.position);
                }

                const toClosest = Vec2.sub(closestPoint, boid.body.position);
                const dist = toClosest.magnitude();

                const dot = boid.body.linear_velocity.dot(toClosest);

                if (dist < lookAheadDistance && dot > 0) {
                    const escapeDirection = Vec2.sub(boid.body.position, closestPoint).normalize();

                    const multiplier = (lookAheadDistance - dist) / lookAheadDistance;
                    const steeringForce = escapeDirection.scale(multiplier * avoidForceScale);

                    boid.body.force.add(steeringForce);
                }
            }
        }
    }

    static limitSpeed(boids: Boid[]) {
        const offset = 10;
        for (let i = 0; i < boids.length; i++) {
            const boid = boids[i];

            if (boid.body.linear_velocity.magnitudeSq() > boid.speedSq.y)
                boid.body.linear_velocity.normalize().scale(boid.speed.y - offset);

            if (boid.body.linear_velocity.magnitudeSq() < boid.speedSq.x)
                boid.body.linear_velocity.normalize().scale(boid.speed.x + offset);
        }
    }

    static rotateBoids(boids: Boid[]) {
        for (let i = 0; i < boids.length; i++) {
            const vel = boids[i].body.linear_velocity;
            if (vel.magnitudeSq() < 1) continue;
            // -pi/2 aligns the triangle's local +y tip with the velocity direction
            boids[i].body.incline = Math.atan2(vel.y, vel.x) - Math.PI / 2;
        }
    }
}