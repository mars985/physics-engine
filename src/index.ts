import { Worker } from "node:worker_threads";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = new URL('.', import.meta.url).pathname;

const worker = new Worker(
    path.join(__dirname, "worker/physics.worker.js"),
    // { type: "module" }
);

worker.on("message", (data) => {
    // render / visualize
    console.log("Physics update", data);
});

// game loop
setInterval(() => {
    worker.postMessage({ type: "step", dt: 1 / 60 });
}, 16);
