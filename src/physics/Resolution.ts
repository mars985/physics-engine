import { Vec2 } from "../math/Vec2";
import { Body } from "./Body";
import { CollisionManifold } from "./Collision";

export class Resolution {
    static resolve(a: Body, b: Body, m: CollisionManifold) {
        const totalInvMass = a.invMass + b.invMass;
        if (totalInvMass === 0) return; // Both are static

        // --- POSITION CORRECTION (Anti-Sinking) ---
        const percent = 0.2; // Usually 20% to 80%
        const slop = 0.01;

        const correctionMag = Math.max(m.penetration - slop, 0) / totalInvMass * percent;
        const correctionVec = m.normal.clone().scale(correctionMag);

        // Apply positional correction proportional to mass
        a.position.sub(correctionVec.clone().scale(a.invMass));
        b.position.add(correctionVec.clone().scale(b.invMass));

        // --- VELOCITY RESOLUTION (Impulse) ---
        // 1. Calculate relative velocity
        const rv = a.velocity.clone().sub(b.velocity);

        // 2. Calculate velocity relative to the normal
        const velAlongNormal = rv.dot(m.normal);

        // 3. Do not resolve if velocities are already separating
        if (velAlongNormal > 0) return;

        // 4. Calculate impulse magnitude (j)
        const e = Math.min(a.restitution, b.restitution);
        let j = -(1 + e) * velAlongNormal;
        j /= totalInvMass;

        // 5. Apply impulse
        const impulse = m.normal.clone().scale(j);

        // IMPORTANT: A receives the positive impulse, B receives the negative impulse
        a.velocity.add(impulse.clone().scale(a.invMass));
        b.velocity.sub(impulse.clone().scale(b.invMass));
    }
}
