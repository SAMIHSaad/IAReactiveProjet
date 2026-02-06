/* Vehicle.js - Car with Neural Network */

const SAFETY_DISTANCE = 15;  // Minimum distance before crash

function pldistance(p1, p2, x, y) {
    const num = abs((p2.y - p1.y) * x - (p2.x - p1.x) * y + p2.x * p1.y - p2.y * p1.x);
    const den = p5.Vector.dist(p1, p2);
    return num / den;
}

class Vehicle {
    constructor(brain) {
        this.fitness = 0;
        this.dead = false;
        this.finished = false;
        this.pos = createVector(start.x, start.y);
        this.vel = createVector();
        this.acc = createVector();
        this.maxspeed = 5;
        this.maxforce = 0.2;
        this.sight = SIGHT;
        this.index = 0;
        this.counter = 0;
        this.wrongWay = 0;  // Wrong-way counter for one-way detection
        this.progress = 0;  // Progress bonus for going forward
        this.laps = 0;      // Lap counter

        // Create rays
        this.rays = [];
        for (let a = -45; a <= 45; a += 15) {
            this.rays.push(new Ray(this.pos, radians(a)));
        }

        // Brain
        if (brain) {
            this.brain = brain.copy();
        } else {
            this.brain = new NeuralNetwork(this.rays.length, this.rays.length * 2, 2);
        }

        this.goal = null;
    }

    dispose() {
        this.brain.dispose();
    }

    applyBehaviors(walls) {
        let force = this.look(walls);
        this.applyForce(force);
    }

    mutate() {
        this.brain.mutate(MUTATION_RATE);
    }

    applyForce(force) {
        this.acc.add(force);
    }

    update() {
        if (!this.dead && !this.finished) {
            this.pos.add(this.vel);
            this.vel.add(this.acc);
            this.vel.limit(this.maxspeed);
            this.acc.set(0, 0);

            this.counter++;
            if (this.counter > LIFESPAN) {
                this.dead = true;
            }

            // OUT OF TRACK CHECK - if car leaves circuit, it dies
            if (typeof isOnTrack === 'function' && !isOnTrack(this.pos.x, this.pos.y)) {
                this.dead = true;
            }

            for (let ray of this.rays) {
                ray.rotate(this.vel.heading());
            }
        }
    }

    check(checkpoints) {
        if (!this.finished && checkpoints.length > 0) {
            this.goal = checkpoints[this.index];

            // WRONG-WAY DETECTION (sens unique) - STRICT!
            if (this.vel.mag() > 0.3) {
                // Get direction to next checkpoint
                let targetDir = p5.Vector.sub(this.goal.midpoint(), this.pos).normalize();
                let velDir = this.vel.copy().normalize();
                let dotProduct = targetDir.dot(velDir);

                // If going backwards (negative dot product)
                if (dotProduct < -0.2) {
                    this.wrongWay += 2;  // Count faster when going wrong way
                    if (this.wrongWay > 30) { // ~0.5 second going wrong way = death
                        this.dead = true;
                        this.fitness = max(0, this.fitness - 1); // Penalty
                        return;
                    }
                } else if (dotProduct > 0.3) {
                    // Going correct direction - reward!
                    this.wrongWay = max(0, this.wrongWay - 3);
                    this.progress += 0.01; // Small progress bonus
                }
            }

            const d = pldistance(this.goal.a, this.goal.b, this.pos.x, this.pos.y);

            if (d < 15) {
                this.index = (this.index + 1) % checkpoints.length;
                this.fitness += 2;  // Double reward for checkpoint
                this.counter = 0;
                this.wrongWay = 0;

                // Complete lap bonus
                if (this.index === 0) {
                    this.laps++;
                    this.fitness += 10;
                }
            }
        }
    }

    calculateFitness() {
        // Combine checkpoints passed + progress bonus
        let baseFitness = this.fitness + this.progress;
        this.fitness = pow(2, baseFitness);
    }

    look(walls) {
        const inputs = [];

        for (let i = 0; i < this.rays.length; i++) {
            const ray = this.rays[i];
            ray.pos = this.pos;
            let record = this.sight;

            for (let wall of walls) {
                const pt = ray.cast(wall);
                if (pt) {
                    const d = p5.Vector.dist(this.pos, pt);
                    if (d < record) record = d;
                }
            }

            // Safety distance - die before hitting obstacle
            if (record < SAFETY_DISTANCE) this.dead = true;
            inputs[i] = map(record, 0, this.sight, 1, 0);
        }

        const output = this.brain.predict(inputs);

        // FIXED: Limit steering angle to ±60° (not full 360°)
        let steer = map(output[0], 0, 1, -PI / 3, PI / 3);

        // FIXED: Ensure minimum forward speed (2 to maxspeed)
        let speed = map(output[1], 0, 1, 2, this.maxspeed);

        // Apply steering relative to current heading
        let angle = this.vel.heading() + steer;

        const desired = p5.Vector.fromAngle(angle);
        desired.setMag(speed);

        let force = p5.Vector.sub(desired, this.vel);
        force.limit(this.maxforce);
        return force;
    }

    show() {
        push();
        translate(this.pos.x, this.pos.y);
        rotate(this.vel.heading() + HALF_PI);
        imageMode(CENTER);
        image(carImg, 0, 0);  // Pre-scaled image, no resize needed
        pop();
    }

    highlight() {
        push();
        translate(this.pos.x, this.pos.y);
        rotate(this.vel.heading() + HALF_PI);
        imageMode(CENTER);
        image(carImgBest, 0, 0);  // Pre-tinted green image
        pop();

        // Draw rays
        for (let ray of this.rays) {
            ray.show();
        }
    }
}
