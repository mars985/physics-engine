import { Boid } from "../boids/Boid.js";
import { Vec2 } from "../math/Vec2.js";
import { Body, ShapeType } from "../physics/Body.js";
import { generateOrbitVelocity, getRandomColor, getRandomInt } from "../util/util.js";
import { World } from "./World.js";

const width = window.innerWidth;
const height = window.innerHeight;
const wallThickness = 120;
const wallColor = "hsl(217 56% 34.2%)";

const createWall = (x: number, y: number, width: number, height: number, restitution = 1, color = wallColor) =>
    new Body({
        x,
        y,
        w: width,
        h: height,
        mass: 0,
        restitution,
        movable: false,
        color,
        shapeType: ShapeType.Polygon
    });

export class Scenes {
    static addBoundaries(
        world: World,
        restitution = 1,
        wallThickness = 120,
    ) {
        const w = window.innerWidth;
        const h = window.innerHeight;

        const walls = [
            createWall(w * 0.5, -wallThickness * 0.35, w * 2, wallThickness),
            createWall(w * 0.5, h + wallThickness * 0.35, w * 2, wallThickness),
            createWall(-wallThickness * 0.35, h * 0.5, wallThickness, h * 2),
            createWall(w + wallThickness * 0.35, h * 0.5, wallThickness, h * 2),
        ];

        world.addBody(...walls);
    }

    static gravitySandbox(world: World, bodies = 30) {
        world.enable_collisions = true;
        world.enable_mutual_gravity = false;
        world.gravity.y = 400;

        Scenes.addBoundaries(world, 0.9);

        for (let i = 0; i < bodies; i++) {
            world.addBody(new Body({
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
            world.addBody(new Body({
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

    static attraction(world: World, bodies = 800) {
        world.enable_collisions = true;
        world.enable_movable_mutual_gravity = true;
        world.enable_mutual_gravity = true;

        Scenes.addBoundaries(world, 1);

        for (let i = 0; i < bodies; i++) {
            world.addBody(new Body({
                shapeType: ShapeType.Circle,
                x: getRandomInt(wallThickness, width - wallThickness),
                y: getRandomInt(wallThickness, height - wallThickness),
                vertices: Body.createRegularPolygon(6, 5),
                r: 5,
                mass: 100,
                color: "velocity270",
                restitution: 0.9
            }));
        }
        const speed = 300;
        const large = 1;
        for (let i = 0; i < large; i++) {
            world.addBody(new Body({
                shapeType: ShapeType.Circle,
                x: getRandomInt(wallThickness, width - wallThickness),
                y: getRandomInt(wallThickness, height - wallThickness),
                vx: getRandomInt(-speed, speed),
                vy: getRandomInt(-speed, speed),
                w: 20,
                h: 20,
                r: 20,
                mass: 50000,
                color: "velocity",
                restitution: 1
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
        world.addBody(sun);

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

                planet.linear_velocity = generateOrbitVelocity(
                    sun.position,
                    planet.position,
                    sun.mass
                );

                world.addBody(planet);
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
        world.addBody(sun);

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

                planet.linear_velocity = generateOrbitVelocity(
                    sun.position,
                    planet.position,
                    sun.mass
                );

                world.addBody(planet);
            }
        }

    }

    static stacks(world: World, bodies = 70) {
        world.enable_collisions = true;
        Scenes.addBoundaries(world);
        world.gravity = new Vec2(0,100);

        for (let i = 0; i < bodies; i++) {
            world.addBody(new Body({
                shapeType: ShapeType.Polygon,
                x: getRandomInt(wallThickness, width - wallThickness),
                y: getRandomInt(wallThickness, height - wallThickness),
                vertices: Body.createRegularPolygon(4, 35),
                restitution: 0.9,
                mass: 100,
                color: getRandomColor(240, 360),
            }));
        }
    }

    static honeycomb(world: World, bodies = 150) {
        Scenes.addBoundaries(world);
        world.enable_collisions = true;
        world.enable_movable_mutual_gravity = true;
        world.enable_mutual_gravity = true;

        for (let i = 0; i < bodies; i++) {
            world.addBody(new Body({
                shapeType: ShapeType.Polygon,
                x: getRandomInt(wallThickness, width - wallThickness),
                y: getRandomInt(wallThickness, height - wallThickness),
                vertices: Body.createRegularPolygon(6, 25),
                restitution: 0.9,
                mass: 2000,
                color: "velocity",
            }));
        }
    }

    static rotation(world: World) {
        Scenes.addBoundaries(world);
        world.enable_collisions = true;

        const cx = width * 0.5;
        const cy = height * 0.5;

        // Stationary target — will spin from the off-center hit
        world.addBody(new Body({
            shapeType: ShapeType.Polygon,
            x: cx - 60,
            y: cy,
            vertices: Body.createRegularPolygon(4, 30),
            incline:45,
            restitution: 0.6,
            friction: 0.5,
            mass: 20,
            color: "velocity210",
            movable: true
        }));

        // Incoming block — hits the target well above its center (vertex-to-face)
        world.addBody(new Body({
            shapeType: ShapeType.Polygon,
            x: cx + 200,
            y: cy - 45,   // offset so its bottom vertex strikes near target's top edge
            vx: -220,
            vertices: Body.createRegularPolygon(4, 30),
            incline:45,
            restitution: 0.6,
            friction: 0.5,
            mass: 20,
            color: "velocity30",
            movable: true
        }));
    }

    static boids(world: World, count = 100) {
        Scenes.addBoundaries(world);

        let obstacle;
        // obstacle = createWall(400, 300, 500, 30);
        obstacle = new Body({
            shapeType: ShapeType.Polygon,
            vertices: [new Vec2(-160, -100), new Vec2(-160, 100), new Vec2(220, 0)],
            x: 350,
            y: 280,
            color: wallColor,
        })
        obstacle.incline = 145;
        world.addBody(obstacle);

        obstacle = createWall(1400, 700, 200, 30);
        obstacle.incline = 75;
        world.addBody(obstacle);

        world.addBody(new Body({
            shapeType: ShapeType.Circle,
            x: width / 2,
            y: height,
            r: 160,
            color: wallColor
        }))

        world.addBody(new Body({
            shapeType: ShapeType.Circle,
            x: width,
            y: 0,
            r: 260,
            color: wallColor
        }))

        const speed = 180;

        for (let i = 0; i < count; i++) {
            world.addBoid(new Boid({
                body: new Body({
                    shapeType: ShapeType.Polygon,
                    x: getRandomInt(wallThickness, width - wallThickness),
                    y: getRandomInt(wallThickness, height - wallThickness),
                    vertices: [new Vec2(0, 15), new Vec2(-7, -7,), new Vec2(7, -7)],
                    color: Math.random() < 0.07 ? "red" : "blue",
                    movable: true,
                    vx: getRandomInt(-speed, speed),
                    vy: getRandomInt(-speed, speed),
                }),
                speed: new Vec2(speed - 50, speed + 15),
                viewAngle: 180,
                perceptionRadius: speed + 40,
            }))
        }
    }
};
