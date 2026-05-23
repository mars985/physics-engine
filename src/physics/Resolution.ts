import { Vec2 } from "../math/Vec2.js";
import { Body } from "./Body.js";
import { CollisionManifold } from "./Collision.js";

export class Resolution {
    static resolve(a: Body, b: Body, m: CollisionManifold) {
        const totalInvMass = a.invMass + b.invMass;
        if (totalInvMass === 0) return;

        const percent = 0.95;
        const slop = 0.01;

        const correctionMag = Math.max(m.penetration - slop, 0) / totalInvMass * percent;
        const correctionVec = m.normal.clone().scale(correctionMag);

        a.position.sub(correctionVec.clone().scale(a.invMass));
        b.position.add(correctionVec.clone().scale(b.invMass));

        const rv = b.linear_velocity.clone().sub(a.linear_velocity);

        const velAlongNormal = rv.dot(m.normal);

        if (velAlongNormal > 0) return;

        let e = Math.min(a.restitution, b.restitution);
        const RESTING_VELOCITY = 0.5;
        if (Math.abs(velAlongNormal) < RESTING_VELOCITY) {
            e = 0;
        }

        let j = -(1 + e) * velAlongNormal;
        j /= (a.invMass + b.invMass);

        const impulse = m.normal.clone().scale(j);
        a.linear_velocity.sub(impulse.clone().scale(a.invMass));
        b.linear_velocity.add(impulse.clone().scale(b.invMass));
    }

    static resolveWithRotation(a: Body, b: Body, m: CollisionManifold) {
        const contactCount = m.contactList.length;
        if (contactCount === 0) {
            Resolution.resolve(a, b, m);
            return;
        }

        const totalInvMass = a.invMass + b.invMass;
        if (totalInvMass === 0) return;

        // ---- POSITION CORRECTION (same idea as resolve()) ----
        const percent = 0.95;
        const slop = 0.01;
        const correctionMag =
            Math.max(m.penetration - slop, 0) / totalInvMass * percent;

        const correction = m.normal.clone().scale(correctionMag);
        a.position.sub(correction.clone().scale(a.invMass));
        b.position.add(correction.clone().scale(b.invMass));

        // ---- IMPULSE RESOLUTION ----
        const e = Math.min(a.restitution, b.restitution);
        const mu = (a.friction + b.friction) * 0.5;
        const impulses: Vec2[] = [];

        for (let i = 0; i < contactCount; i++) {
            const contact = m.contactList[i];

            const ra = contact.clone().sub(a.position);
            const rb = contact.clone().sub(b.position);

            const raPerp = new Vec2(-ra.y, ra.x);
            const rbPerp = new Vec2(-rb.y, rb.x);

            // Velocity at contact point on each body (linear + rotational)
            const velA = a.linear_velocity.clone().add(raPerp.clone().scale(a.angular_velocity));
            const velB = b.linear_velocity.clone().add(rbPerp.clone().scale(b.angular_velocity));

            const rv = velB.sub(velA); // relative velocity at contact (velB is a clone)
            const velAlongNormal = rv.dot(m.normal);

            if (velAlongNormal > 0) {
                impulses.push(new Vec2());
                continue;
            }

            const RESTING_VELOCITY = 0.5;
            const resolvedE = Math.abs(velAlongNormal) < RESTING_VELOCITY ? 0 : e;

            const raCrossN = ra.cross(m.normal);
            const rbCrossN = rb.cross(m.normal);
            const denom =
                totalInvMass +
                (raCrossN * raCrossN) * a.invInertia +
                (rbCrossN * rbCrossN) * b.invInertia;

            // Normal impulse scalar
            const j = -(1 + resolvedE) * velAlongNormal / denom / contactCount;
            const normalImpulse = m.normal.clone().scale(j);

            // ---- TANGENTIAL (FRICTION) IMPULSE ----
            // Tangential relative velocity = rv minus its normal component
            const vtX = rv.x - velAlongNormal * m.normal.x;
            const vtY = rv.y - velAlongNormal * m.normal.y;
            const vtMag = Math.hypot(vtX, vtY);

            let frictionImpulse = new Vec2();
            if (vtMag > 1e-4) {
                // Tangent points in the direction of sliding (B relative to A)
                const tangent = new Vec2(vtX / vtMag, vtY / vtMag);

                const raCrossT = ra.cross(tangent);
                const rbCrossT = rb.cross(tangent);
                const denomT =
                    totalInvMass +
                    (raCrossT * raCrossT) * a.invInertia +
                    (rbCrossT * rbCrossT) * b.invInertia;

                // jt is negative: friction opposes the sliding direction
                let jt = -vtMag / denomT / contactCount;

                // Coulomb's cone: |friction impulse| <= mu * |normal impulse|
                if (Math.abs(jt) > mu * j) jt = -mu * j;

                frictionImpulse = tangent.scale(jt);
            }

            impulses.push(normalImpulse.add(frictionImpulse));
        }

        // ---- APPLY IMPULSES ----
        for (let i = 0; i < contactCount; i++) {
            const impulse = impulses[i];
            if (impulse.x === 0 && impulse.y === 0) continue;

            const ra = m.contactList[i].clone().sub(a.position);
            const rb = m.contactList[i].clone().sub(b.position);

            a.linear_velocity.sub(impulse.clone().scale(a.invMass));
            a.angular_velocity -= ra.cross(impulse) * a.invInertia;

            b.linear_velocity.add(impulse.clone().scale(b.invMass));
            b.angular_velocity += rb.cross(impulse) * b.invInertia;
        }
    }

}
