import { World } from "./core/World";
import { Body, ShapeType } from "./physics/Body";
import { Renderer } from "./render/Renderer";
import { getRandomColor, getRandomInt } from "./util/util";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const ctx = canvas.getContext("2d")!;
const renderer = new Renderer(ctx);

const world = new World();

// WORLD BOUNDARIES
const width = window.innerWidth;
const height = window.innerHeight;
const wallThickness = 60;
const wallRestitution = 1;

const top = new Body({ x: width / 2, y: 0, w: width * 2, h: wallThickness, mass: 0, restitution: wallRestitution, color: "gray" });
const bottom = new Body({ x: width / 2, y: height, w: width * 2, h: wallThickness, mass: 0, restitution: wallRestitution, color: "gray" });
const left = new Body({ x: 0, y: height / 2, w: wallThickness, h: height * 2, mass: 0, restitution: wallRestitution, color: "gray" });
const right = new Body({ x: width, y: height / 2, w: wallThickness, h: height * 2, mass: 0, restitution: wallRestitution, color: "gray" });

// world.add(top);
// world.add(bottom);
// world.add(left);
// world.add(right);

// SUNS

const Sun = new Body({ x: width * 0.65, y: height * 0.7, mass: 5000, color: "red", shapeType: ShapeType.Circle, r: 10, movable: false })
const Sun2 = new Body({ x: width * 0.35, y: height * 0.7, mass: 5000, color: "red", shapeType: ShapeType.Circle, r: 10, movable: false })
const Sun3 = new Body({ x: width * 0.5, y: height * 0.3, mass: 7000, color: "red", shapeType: ShapeType.Circle, r: 10, movable: false })
const Sun4 = new Body({ x: width * 0.5, y: height * 0.7, mass: 10000, color: "red", shapeType: ShapeType.Circle, r: 10, movable: true })
world.add(Sun);
world.add(Sun2);
world.add(Sun3);
// world.add(Sun4);

// Bodies

world.gravity.x = 0;
world.gravity.y = 0;
world.enable_mutual_gravity = true;
const BODIES = 20000;

function generateBody() {
  world.add(new Body({
    shapeType: ShapeType.Circle,
    x: getRandomInt(wallThickness, width - 2 * wallThickness),
    y: getRandomInt(wallThickness * 2, height - 2 * wallThickness),
    // vx: getRandomInt(-90, 90),
    // vy: getRandomInt(-100, 100),
    w: 20,
    h: 20,
    r: 1,
    restitution: 1,
    mass: getRandomInt(30, 30),
    // color: getRandomColor(),
  }));
}
for (let index = 0; index < BODIES; index++) {
  generateBody();
}

// Integrate

const FRAMES = 60;
const FIXED_DT = 1 / FRAMES;
let accumulator = 0;
let lastTime = performance.now();

function loop(time: number) {
  const delta = (time - lastTime) / 1000;
  lastTime = time;

  accumulator += delta;

  while (accumulator >= FIXED_DT) {
    world.step(FIXED_DT);
    accumulator -= FIXED_DT;
  }

  renderer.draw(world);
  requestAnimationFrame(loop);
}

loop(performance.now());
