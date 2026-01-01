import { Body } from "./Body.js";
import { CollisionManifold } from "./Collision.js";

export class Resolution {
    static resolve(a: Body, b: Body, m: CollisionManifold) {
        const totalInvMass = a.invMass + b.invMass;
        if (totalInvMass === 0) return; // Both are static

        // --- POSITION CORRECTION (Anti-Sinking) ---
        const percent = 0.95; // Usually 20% to 80%
        const slop = 0.01;

        const correctionMag = Math.max(m.penetration - slop, 0) / totalInvMass * percent;
        const correctionVec = m.normal.clone().scale(correctionMag);

        // Apply positional correction proportional to mass
        a.position.sub(correctionVec.clone().scale(a.invMass));
        b.position.add(correctionVec.clone().scale(b.invMass));

        // --- VELOCITY RESOLUTION (Impulse) ---
        // 1. Relative Velocity (B relative to A)
        const rv = b.velocity.clone().sub(a.velocity);

        // 2. Velocity along normal
        const velAlongNormal = rv.dot(m.normal);

        // 3. Do not resolve if velocities are already separating
        if (velAlongNormal > 0) return;

        // 4. Calculate impulse magnitude
        let e = Math.min(a.restitution, b.restitution);
        if (velAlongNormal > -1) {
            e = 0; // resting contact
        }
        let j = -(1 + e) * velAlongNormal;
        j /= (a.invMass + b.invMass);

        // 5. Apply impulse (A gets negative, B gets positive)
        const impulse = m.normal.clone().scale(j);
        a.velocity.sub(impulse.clone().scale(a.invMass));
        b.velocity.add(impulse.clone().scale(b.invMass));
    }
}
