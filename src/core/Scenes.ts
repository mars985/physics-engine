import { Vec2 } from "../math/Vec2.js";
import { Body, ShapeType } from "../physics/Body.js";
import { generateOrbitVelocity, getRandomColor, getRandomInt } from "../util/util.js";
import { World } from "./World.js";

const width = window.innerWidth;
const height = window.innerHeight;
const wallThickness = 120;

export class Scenes {
    static loadScene(name: string, world: World) {
        world.clear();
        switch (name) {
            case "gravity":
                Scenes.gravitySandbox(world);
                break;
            case "zero":
                Scenes.zeroGravity(world);
                break;
            case "attraction":
                Scenes.attraction(world);
                break;
            case "spirals":
                Scenes.spirals(world);
                break;
            case "polka":
                Scenes.polka(world);
                break;
        }
    }
    
    static addBoundaries(world: World, restitution = 1, color = "hsl(217 56% 34.2%)") {
        const w = window.innerWidth;
        const h = window.innerHeight;

        world.add(
            new Body({ x: w * 0.5, y: -wallThickness * 0.35, w: w * 2, h: wallThickness, mass: 0, restitution, movable: false, color: color }),
            new Body({ x: w * 0.5, y: h + wallThickness * 0.35, w: w * 2, h: wallThickness, mass: 0, restitution, movable: false, color: color }),
            new Body({ x: -wallThickness * 0.35, y: h * 0.5, w: wallThickness, h: h * 2, mass: 0, restitution, movable: false, color: color }),
            new Body({ x: w + wallThickness * 0.35, y: h * 0.5, w: wallThickness, h: h * 2, mass: 0, restitution, movable: false, color: color })
        );
    }

    static gravitySandbox(world: World, bodies = 30) {
        world.enable_collisions = true;
        world.enable_mutual_gravity = false;
        world.gravity.y = 400;

        Scenes.addBoundaries(world, 0.9);

        for (let i = 0; i < bodies; i++) {
            world.add(new Body({
                shapeType: ShapeType.Circle,
                x: getRandomInt(wallThickness, width - wallThickness),
                y: getRandomInt(wallThickness, height - wallThickness),
                w: 20,
                h: 20,
                r: 20,
                restitution: 0.95,
                mass: 100,
                color: getRandomColor(0, 60)
            }));
        }
    }

    static zeroGravity(world: World, bodies = 30) {
        world.enable_collisions = true;
        world.enable_mutual_gravity = false;

        Scenes.addBoundaries(world, 1);
        const speed = 75;

        for (let i = 0; i < bodies; i++) {
            world.add(new Body({
                shapeType: ShapeType.Circle,
                x: getRandomInt(wallThickness, width - wallThickness),
                y: getRandomInt(wallThickness, height - wallThickness),
                vx: getRandomInt(-speed, speed),
                vy: getRandomInt(-speed, speed),
                w: 20,
                h: 20,
                r: getRandomInt(15, 20),
                mass: 10,
                color: getRandomColor(240, 360)
            }));
        }
    }

    static attraction(world: World, bodies = 400) {
        world.enable_collisions = true;
        world.enable_movable_mutual_gravity = true;
        world.enable_mutual_gravity = true;

        Scenes.addBoundaries(world, 1);

        for (let i = 0; i < bodies; i++) {
            world.add(new Body({
                shapeType: ShapeType.Circle,
                x: getRandomInt(wallThickness, width - wallThickness),
                y: getRandomInt(wallThickness, height - wallThickness),
                w: 20,
                h: 20,
                r: 7,
                mass: getRandomInt(50, 50),
                color: "velocity",
                restitution: 0.9
            }));
        }
        const speed = 300;
        const large = 0;
        for (let i = 0; i < large; i++) {
            world.add(new Body({
                shapeType: ShapeType.Circle,
                x: getRandomInt(wallThickness, width - wallThickness),
                y: getRandomInt(wallThickness, height - wallThickness),
                vx: getRandomInt(-speed, speed),
                vy: getRandomInt(-speed, speed),
                w: 20,
                h: 20,
                r: 20,
                mass: 5000,
                color: "velocity",
                restitution: 0.9
            }));
        }
    }

    static spirals(world: World, symmetry = 36) {
        world.enable_mutual_gravity = true;
        world.enable_movable_mutual_gravity = false;
        world.enable_collisions = false;

        const center = new Vec2(width * 0.5, height * 0.5);
        const sun = new Body({
            x: center.x,
            y: center.y,
            r: 25,
            mass: 70000,
            shapeType: ShapeType.Circle,
            movable: false,
            color: "blue"
        });
        world.add(sun);

        const planetCount = 60;
        const baseRadius = 15;
        let currentOrbitRadius = 100;
        for (let i = 0; i < planetCount; i++) {
            const r = baseRadius / Math.log2(i + 4);
            currentOrbitRadius += r * 4;
            const orbitRadius = currentOrbitRadius;
            for (let k = 0; k < symmetry; k++) {
                const angle = (2 * Math.PI * k) / symmetry;

                const x = center.x + Math.cos(angle) * orbitRadius;
                const y = center.y + Math.sin(angle) * orbitRadius;

                const planet = new Body({
                    x,
                    y,
                    r: r,
                    mass: 0.01,
                    shapeType: ShapeType.Circle,
                    color: "rainbow"
                });

                planet.velocity = generateOrbitVelocity(
                    sun.position,
                    planet.position,
                    sun.mass
                );

                world.add(planet);
            }
        }
    }

    static polka(world: World, density = 0.020) {
        world.enable_mutual_gravity = true;
        world.enable_movable_mutual_gravity = false;
        world.enable_collisions = false;

        const center = new Vec2(width * 0.5, height * 0.5);
        const sun = new Body({
            x: center.x,
            y: center.y,
            r: 25,
            mass: 70000,
            shapeType: ShapeType.Circle,
            movable: false,
            color: "blue"
        });
        world.add(sun);

        const planetCount = 30;
        const baseRadius = 15;
        let currentOrbitRadius = 100;
        for (let i = 0; i < planetCount; i++) {
            const r = baseRadius / Math.log2(i + 4);
            currentOrbitRadius += r * 4 + 10;
            const orbitRadius = currentOrbitRadius;

            const count = Math.floor(2 * Math.PI * orbitRadius * density);

            for (let k = 0; k < count; k++) {
                const angle = (2 * Math.PI * k) / count;

                const x = center.x + Math.cos(angle) * orbitRadius;
                const y = center.y + Math.sin(angle) * orbitRadius;

                const planet = new Body({
                    x,
                    y,
                    r,
                    mass: 0.01,
                    shapeType: ShapeType.Circle,
                    color: "rainbow",
                });

                planet.velocity = generateOrbitVelocity(
                    sun.position,
                    planet.position,
                    sun.mass
                );

                world.add(planet);
            }
        }

    }
};
