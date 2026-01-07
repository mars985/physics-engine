import { Vec2 } from "../math/Vec2";

// Utility helpers
export function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

export function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

export function getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// More pleasant random colors (pastel-ish)
export function getRandomColor(hueMin = 0, hueMax = 360): string {
    let hue = getRandomInt(hueMin, hueMax);
    hue = hue > 360 ? hue % 360 : hue;
    const saturation = getRandomInt(55, 70);
    const lightness = getRandomInt(50, 75);
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

export function extractVelocityHue(color: string, defaultHue = 240): number {
    const match = color.match(/velocity(-?\d+(\.\d+)?)/);
    if (!match) return defaultHue;
    return Number(match[1]);
}

export function getVelocityColor(
    velocity: number,
    baseHue = 270,
    maxVelocity = 350,
    hueRange = 30
): string {
    const t = clamp(velocity / maxVelocity, 0, 1);

    const hue = baseHue + lerp(-hueRange, hueRange, t);

    const saturation = lerp(65, 85, t);
    const lightness = lerp(50, 65, t);

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

export function generateOrbitVelocity(
    sunPos: Vec2,
    planetPos: Vec2,
    sunMass: number,
    G = 100
): Vec2 {
    const r = planetPos.clone().sub(sunPos);
    const dist = r.magnitude();
    const speed = Math.sqrt((G * sunMass) / dist);

    // Tangential direction (rotate 90 degrees)
    const tangent = new Vec2(-r.y, r.x).normalize();

    // Final velocity vector
    return tangent.scale(speed);
}
