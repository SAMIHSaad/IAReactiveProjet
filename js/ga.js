/* GA.js - Genetic Algorithm */

function nextGeneration() {
    console.log('Generation: ' + (generationCount + 1));

    calculateFitnessForAllCars();

    for (let i = 0; i < TOTAL; i++) {
        population[i] = pickOne();
    }

    for (let v of savedVehicles) {
        v.dispose();
    }
    savedVehicles = [];
}

function pickOne() {
    let index = 0;
    let r = random(1);

    while (r > 0 && index < savedVehicles.length) {
        r -= savedVehicles[index].fitness;
        index++;
    }
    index = constrain(index - 1, 0, savedVehicles.length - 1);

    let parent = savedVehicles[index];
    let child = new Vehicle(parent.brain);
    child.mutate();
    return child;
}

function calculateFitnessForAllCars() {
    for (let v of savedVehicles) {
        v.calculateFitness();
    }

    let sum = 0;
    for (let v of savedVehicles) {
        sum += v.fitness;
    }

    if (sum > 0) {
        for (let v of savedVehicles) {
            v.fitness = v.fitness / sum;
        }
    }
}
