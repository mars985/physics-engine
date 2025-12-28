import { World } from "./core/World";
import { Body } from "./physics/Body";
import { Renderer } from "./render/Renderer";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const ctx = canvas.getContext("2d")!;
const renderer = new Renderer(ctx);

const world = new World();
// world.add(new Body(100, 50, 2,2,1,80,140));
const boxA = new Body(100, 200, 50, 50, 20, 70, 0, 1, "red");
const boxB = new Body(300, 200, 50, 50, 20, -80, 0, 0.9, "blue");

world.add(boxA);
world.add(boxB);

const FIXED_DT = 1 / 60;
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
