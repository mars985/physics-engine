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
        if (contactCount === 0) return;

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
        const impulses: Vec2[] = [];

        for (let i = 0; i < contactCount; i++) {
            const contact = m.contactList[i];

            const ra = contact.clone().sub(a.position);
            const rb = contact.clone().sub(b.position);

            const raPerp = new Vec2(-ra.y, ra.x);
            const rbPerp = new Vec2(-rb.y, rb.x);

            const velA = a.linear_velocity.clone()
                .add(raPerp.clone().scale(a.angular_velocity));
            const velB = b.linear_velocity.clone()
                .add(rbPerp.clone().scale(b.angular_velocity));

            const rv = velB.sub(velA);
            const velAlongNormal = rv.dot(m.normal);

            // Objects separating → no impulse
            if (velAlongNormal > 0) {
                impulses.push(new Vec2());
                continue;
            }

            const raCrossN = ra.cross(m.normal);
            const rbCrossN = rb.cross(m.normal);

            const denom =
                a.invMass +
                b.invMass +
                (raCrossN * raCrossN) * a.invInertia +
                (rbCrossN * rbCrossN) * b.invInertia;

            let j = -(1 + e) * velAlongNormal;
            j /= denom;
            j /= contactCount;

            impulses.push(m.normal.clone().scale(j));
        }

        // ---- APPLY IMPULSES ----
        for (let i = 0; i < contactCount; i++) {
            const impulse = impulses[i];
            if (impulse.magnitude() === 0) continue;

            const ra = m.contactList[i].clone().sub(a.position);
            const rb = m.contactList[i].clone().sub(b.position);

            a.linear_velocity.sub(impulse.clone().scale(a.invMass));
            a.angular_velocity -= ra.cross(impulse) * a.invInertia;

            b.linear_velocity.add(impulse.clone().scale(b.invMass));
            b.angular_velocity += rb.cross(impulse) * b.invInertia;
        }
    }

}
