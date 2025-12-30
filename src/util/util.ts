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
export function getRandomColor(): string {
    const hue = getRandomInt(0, 360);
    const saturation = getRandomInt(50, 70);
    const lightness = getRandomInt(55, 75);
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// Velocity → Color (blue → red)
export function getVelocityColor(
    velocity: number,
    maxVelocity = 1000
): string {
    const t = clamp(velocity / maxVelocity, 0, 1);

    // Blue (240°) → Red (0°)
    const hue = lerp(240, 0, t);
    const saturation = 70;
    const lightness = lerp(40, 60, t);

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}
