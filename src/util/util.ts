export function getRandomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getRandomColor() {
    const hue = getRandomInt(0, 360);
    const saturation = 40;
    const luminosity = 70;
    return `hsl(${hue}, ${saturation}%, ${luminosity}%)`;
}
