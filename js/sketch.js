/* ===================================
   sketch.js - Main Application
   Car Racing with Genetic Algorithm
   =================================== */

const TOTAL = 100;
const MUTATION_RATE = 0.1;
const LIFESPAN = 200;
const SIGHT = 100;

let carImg;       // Car sprite image (small)
let carImgBest;   // Car sprite for best car (green tinted, pre-rendered)

function preload() {
    carImg = loadImage('car.png');
}

// Create pre-scaled and tinted images after setup
function createCarSprites() {
    // Create small car image
    let smallCar = createGraphics(25, 40);
    smallCar.imageMode(CENTER);
    smallCar.translate(12.5, 20);
    smallCar.image(carImg, 0, 0, 25, 40);
    carImg = smallCar;

    // Create green-tinted best car image
    let bestCar = createGraphics(30, 48);
    bestCar.imageMode(CENTER);
    bestCar.translate(15, 24);
    bestCar.tint(100, 255, 100);
    bestCar.image(carImg, 0, 0, 30, 48);
    carImgBest = bestCar;
}

let walls = [];
let checkpoints = [];
let inside = [];
let outside = [];
let obstacles = [];

let population = [];
let savedVehicles = [];

let start;
let generationCount = 0;
let speedSlider;

/**
 * Build track using Perlin noise
 */
function buildTrack() {
    checkpoints = [];
    inside = [];
    outside = [];
    walls = [];

    let noiseMax = 4;
    const total = 50;
    const pathWidth = 60;

    let startX = random(1000);
    let startY = random(1000);

    for (let i = 0; i < total; i++) {
        let a = map(i, 0, total, 0, TWO_PI);
        let xoff = map(cos(a), -1, 1, 0, noiseMax) + startX;
        let yoff = map(sin(a), -1, 1, 0, noiseMax) + startY;
        let xr = map(noise(xoff, yoff), 0, 1, 100, width * 0.4);
        let yr = map(noise(xoff, yoff), 0, 1, 100, height * 0.4);

        let x1 = width / 2 + (xr - pathWidth) * cos(a);
        let y1 = height / 2 + (yr - pathWidth) * sin(a);
        let x2 = width / 2 + (xr + pathWidth) * cos(a);
        let y2 = height / 2 + (yr + pathWidth) * sin(a);

        checkpoints.push(new Boundary(x1, y1, x2, y2));
        inside.push(createVector(x1, y1));
        outside.push(createVector(x2, y2));
    }

    for (let i = 0; i < checkpoints.length; i++) {
        let a1 = inside[i];
        let b1 = inside[(i + 1) % checkpoints.length];
        walls.push(new Boundary(a1.x, a1.y, b1.x, b1.y));

        let a2 = outside[i];
        let b2 = outside[(i + 1) % checkpoints.length];
        walls.push(new Boundary(a2.x, a2.y, b2.x, b2.y));
    }

    start = checkpoints[0].midpoint();
}

/**
 * Add obstacle on track
 */
function addObstacle() {
    if (checkpoints.length === 0) return;

    let idx = floor(random(checkpoints.length));
    let t = random(0.3, 0.7);
    let x = lerp(inside[idx].x, outside[idx].x, t);
    let y = lerp(inside[idx].y, outside[idx].y, t);
    let r = random(10, 20);

    obstacles.push({ x, y, r });

    // Add walls around obstacle
    const segs = 8;
    for (let i = 0; i < segs; i++) {
        let a1 = (i / segs) * TWO_PI;
        let a2 = ((i + 1) / segs) * TWO_PI;
        walls.push(new Boundary(
            x + cos(a1) * r, y + sin(a1) * r,
            x + cos(a2) * r, y + sin(a2) * r
        ));
    }

    select('#obs').html(obstacles.length);
}

/**
 * Clear all obstacles
 */
function clearObstacles() {
    obstacles = [];
    buildTrack();
    select('#obs').html(0);
}

function setup() {
    createCanvas(1200, 800);
    tf.setBackend('cpu');

    createCarSprites();  // Pre-render car sprites for performance

    buildTrack();

    for (let i = 0; i < TOTAL; i++) {
        population[i] = new Vehicle();
    }

    speedSlider = createSlider(1, 10, 1);
    speedSlider.position(10, height - 30);
}

function draw() {
    background(26, 26, 46);

    const cycles = speedSlider.value();
    let bestP = population[0];

    for (let n = 0; n < cycles; n++) {
        for (let vehicle of population) {
            vehicle.applyBehaviors(walls);
            vehicle.check(checkpoints);
            vehicle.update();

            if (vehicle.fitness > bestP.fitness) {
                bestP = vehicle;
            }
        }

        for (let i = population.length - 1; i >= 0; i--) {
            const vehicle = population[i];
            if (vehicle.dead || vehicle.finished) {
                savedVehicles.push(population.splice(i, 1)[0]);
            }
        }

        if (population.length === 0) {
            buildTrack();
            // Re-add obstacles
            let temp = obstacles.slice();
            obstacles = [];
            for (let o of temp) {
                obstacles.push(o);
                const segs = 8;
                for (let i = 0; i < segs; i++) {
                    let a1 = (i / segs) * TWO_PI;
                    let a2 = ((i + 1) / segs) * TWO_PI;
                    walls.push(new Boundary(
                        o.x + cos(a1) * o.r, o.y + sin(a1) * o.r,
                        o.x + cos(a2) * o.r, o.y + sin(a2) * o.r
                    ));
                }
            }
            nextGeneration();
            generationCount++;
        }
    }

    // Draw track surface
    fill(40, 40, 60);
    noStroke();
    beginShape();
    for (let pt of outside) vertex(pt.x, pt.y);
    beginContour();
    for (let i = inside.length - 1; i >= 0; i--) vertex(inside[i].x, inside[i].y);
    endContour();
    endShape(CLOSE);

    // Draw walls
    stroke(255);
    strokeWeight(2);
    for (let wall of walls) {
        line(wall.a.x, wall.a.y, wall.b.x, wall.b.y);
    }

    // Draw checkpoints
    stroke(0, 100, 255, 100);
    strokeWeight(1);
    for (let cp of checkpoints) {
        line(cp.a.x, cp.a.y, cp.b.x, cp.b.y);
    }

    // Draw start line
    stroke(255, 255, 0);
    strokeWeight(4);
    let s = checkpoints[0];
    line(s.a.x, s.a.y, s.b.x, s.b.y);

    // Draw obstacles
    fill(255, 150, 50);
    stroke(255, 100, 0);
    strokeWeight(2);
    for (let o of obstacles) {
        ellipse(o.x, o.y, o.r * 2);
    }

    // Draw vehicles
    for (let vehicle of population) {
        vehicle.show();
    }

    // Highlight best
    if (bestP) bestP.highlight();

    // Update UI
    select('#gen').html(generationCount);
    select('#alive').html(population.length);
    select('#best').html(bestP ? bestP.fitness : 0);
    select('#laps').html(bestP ? bestP.laps : 0);
}

/**
 * Add obstacle at specific position (mouse click)
 */
function addObstacleAt(x, y) {
    let r = 15;
    obstacles.push({ x, y, r });

    // Add walls around obstacle
    const segs = 8;
    for (let i = 0; i < segs; i++) {
        let a1 = (i / segs) * TWO_PI;
        let a2 = ((i + 1) / segs) * TWO_PI;
        walls.push(new Boundary(
            x + cos(a1) * r, y + sin(a1) * r,
            x + cos(a2) * r, y + sin(a2) * r
        ));
    }

    select('#obs').html(obstacles.length);
}

/**
 * Remove obstacle at position if exists
 * Returns true if removed, false otherwise
 */
function removeObstacleAt(x, y) {
    for (let i = obstacles.length - 1; i >= 0; i--) {
        let o = obstacles[i];
        let d = dist(x, y, o.x, o.y);
        if (d < o.r + 10) {  // Click within obstacle radius
            obstacles.splice(i, 1);
            // Rebuild walls without removed obstacle
            rebuildWalls();
            select('#obs').html(obstacles.length);
            return true;
        }
    }
    return false;
}

/**
 * Rebuild all walls (track + obstacles)
 */
function rebuildWalls() {
    // Rebuild track walls
    walls = [];
    for (let i = 0; i < checkpoints.length; i++) {
        let a1 = inside[i];
        let b1 = inside[(i + 1) % checkpoints.length];
        walls.push(new Boundary(a1.x, a1.y, b1.x, b1.y));

        let a2 = outside[i];
        let b2 = outside[(i + 1) % checkpoints.length];
        walls.push(new Boundary(a2.x, a2.y, b2.x, b2.y));
    }

    // Re-add obstacle walls
    for (let o of obstacles) {
        const segs = 8;
        for (let i = 0; i < segs; i++) {
            let a1 = (i / segs) * TWO_PI;
            let a2 = ((i + 1) / segs) * TWO_PI;
            walls.push(new Boundary(
                o.x + cos(a1) * o.r, o.y + sin(a1) * o.r,
                o.x + cos(a2) * o.r, o.y + sin(a2) * o.r
            ));
        }
    }
}

/**
 * Check if a point is on the track (between inside and outside)
 */
function isOnTrack(px, py) {
    // Simple check: point should be inside outer boundary but outside inner boundary
    let insideOuter = false;
    let insideInner = false;

    // Check if inside outer polygon
    let j = outside.length - 1;
    for (let i = 0; i < outside.length; i++) {
        if ((outside[i].y > py) !== (outside[j].y > py) &&
            px < (outside[j].x - outside[i].x) * (py - outside[i].y) / (outside[j].y - outside[i].y) + outside[i].x) {
            insideOuter = !insideOuter;
        }
        j = i;
    }

    // Check if inside inner polygon
    j = inside.length - 1;
    for (let i = 0; i < inside.length; i++) {
        if ((inside[i].y > py) !== (inside[j].y > py) &&
            px < (inside[j].x - inside[i].x) * (py - inside[i].y) / (inside[j].y - inside[i].y) + inside[i].x) {
            insideInner = !insideInner;
        }
        j = i;
    }

    // On track if inside outer but outside inner
    return insideOuter && !insideInner;
}

/**
 * Handle mouse click - add or remove obstacle
 */
function mousePressed() {
    // Only handle if clicking on canvas area (not on UI)
    if (mouseX > 200 && mouseX < width && mouseY > 0 && mouseY < height) {
        // First try to remove an obstacle if clicking on one
        if (!removeObstacleAt(mouseX, mouseY)) {
            // If not removing, add new obstacle
            addObstacleAt(mouseX, mouseY);
        }
    }
}

