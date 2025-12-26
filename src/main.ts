import { World } from "./core/World";
import { Body } from "./physics/Body";
import { Renderer } from "./render/Renderer";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const ctx = canvas.getContext("2d")!;
const renderer = new Renderer(ctx);

const world = new World();
world.add(new Body(100, 50));

let last = performance.now();

function loop(time: number) {
  const dt = (time - last) / 1000;
  last = time;

  world.step(dt);
  renderer.draw(world);

  requestAnimationFrame(loop);
}

loop(performance.now());
