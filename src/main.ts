import { World } from "./core/World.js";
import { Vec2 } from "./math/Vec2.js";
import { Body, ShapeType } from "./physics/Body.js";
import { Renderer } from "./render/Renderer.js";
import { Scenes } from "./core/Scenes.js";

// -------- WORLD --------

const world = new World();
// Scenes.gravitySandbox(world);
// Scenes.zeroGravity(world);
// Scenes.attraction(world);
// Scenes.spirals(world);
Scenes.polka(world);

// -------- RENDERING -------- 

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const ctx = canvas.getContext("2d")!;
const renderer = new Renderer(ctx);

const FPS = 60;
const FIXED_DT = 1 / FPS;
let PAUSE = false;
let FOCUS = true;
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
  if (PAUSE || !FOCUS) {
    return;
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);


// -------- LISTENERS -------- 

let Mouse = new Vec2();
document.addEventListener("mousemove", (event: MouseEvent) => {
  Mouse.x = event.clientX;
  Mouse.y = event.clientY;
});

document.querySelectorAll("#ui button").forEach(btn => {
  btn.addEventListener("click", () => {
    const scene = btn.getAttribute("data-scene")!;
    Scenes.loadScene(scene, world);
  });
});

function resume() {
  accumulator = 0;
  lastTime = performance.now();
  loop(performance.now());
}
document.addEventListener("keydown", (event: KeyboardEvent) => {
  if (event.key === " ") {
    PAUSE = !PAUSE;
    if (!PAUSE) resume();
  }
});
window.addEventListener("focus", () => {
  FOCUS = true;
  if (!PAUSE) resume();
});
window.addEventListener("blur", () => {
  FOCUS = false;
});

// world.add(new Body({ x: 20, y: 30, w: 800, h: 60, shapeType: ShapeType.Box, movable: false }))
document.addEventListener("click", (event: MouseEvent) => {
  if (Mouse.x < 800 && Mouse.y < 60)
    return;
  if (!world.bodies.some((b, i) => findImmovable(b, i))) {
    world.add(new Body({ x: Mouse.x, y: Mouse.y, mass: 10000, color: "red", movable: false, r: 5, shapeType: ShapeType.Circle }));
  } else {
    world.remove(world.bodies.findIndex((b, i) => findImmovable(b, i)));
  }
});

function findImmovable(b: Body, i: number) {
  return !b.movable && b.position.clone().sub(Mouse.clone()).magnitude() <= 50;
}