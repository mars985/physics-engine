export function getRandomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getRandomColor() {
    const hue = getRandomInt(0, 360);
    const saturation = 40;
    const luminosity = 70;
    return `hsl(${hue}, ${saturation}%, ${luminosity}%)`;
}

export function getVelocityColor(velocity: number) {
    const hue = 200;
    const luminosity = 20 + velocity / 5;
    const saturation = 50;
    return `hsl(${hue}, ${saturation}%, ${luminosity}%)`;
}
export function getAccelerationColor(acc: number, maxAcc: number) {
    const min = 1e-3;
    const norm = Math.log(acc + 1) / Math.log(maxAcc + 1);
    const hue = 240 - 240 * norm;
    return `hsl(${hue}, 70%, 50%)`;
}
