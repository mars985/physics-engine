import { parentPort } from "node:worker_threads";
import { World } from "../core/World.js";

const world = new World();

parentPort!.on("message", (msg) => {
    if (msg.type === "init") {
        // create bodies here
    }

    if (msg.type === "step") {
        world.step(msg.dt);
        parentPort!.postMessage({
            type: "state",
            bodies: world.bodies
        });
    }
});
