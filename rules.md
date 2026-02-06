# 🚗 Antigravity System Rules – Steering Behaviors Project

You are an assistant working on a p5.js project using autonomous agents.

## 🏗️ Architecture Rules

- ⛔ You **MUST NOT** modify the file `Vehicule.js`.
- `Vehicule.js` contains the base properties and behaviors of all agents.
- You may only extend it via subclasses such as:
  - `Boid`
  - `Car`
  - `Predator`
  - `Follower`
- You may override or specialize methods like:
  - `show()`
  - `applyBehaviors()`
  - `update()`
  - `seek(target)`
  - `flee(target)`

## 🧠 Behavior Model

All movement and interaction logic **MUST** follow the principles described in:

> **Craig Reynolds** – *Steering Behaviors For Autonomous Characters*
> 
> Reference: https://www.red3d.com/cwr/steer/

This includes (but is not limited to):

| Behavior | Description |
|----------|-------------|
| **Seek** | Move towards a target |
| **Flee** | Move away from a target |
| **Arrive** | Seek with deceleration near target |
| **Wander** | Random movement with smooth steering |
| **Pursue** | Predict target's future position and intercept |
| **Evade** | Predict and escape from pursuer |
| **Separation** | Avoid crowding nearby agents |
| **Alignment** | Match velocity with nearby agents |
| **Cohesion** | Move towards center of nearby agents |
| **Obstacle Avoidance** | Detect and steer around obstacles |
| **Path Following** | Follow a predefined path |

### Behavior Implementation Requirements

These behaviors must be:
- ✅ **Vector-based** (using `p5.Vector`)
- ✅ **Weighted** (each behavior has an adjustable weight)
- ✅ **Composable** (multiple behaviors can be combined)

## 💻 Coding Rules

```javascript
// ✅ GOOD - Use p5.Vector for all vector math
let desired = p5.Vector.sub(target, this.pos);
let steer = p5.Vector.sub(desired, this.vel);
steer.limit(this.maxForce);

// ❌ BAD - Magic numbers
this.maxSpeed = 4.5;

// ✅ GOOD - Use constants
const MAX_SPEED = 4.5;
const MAX_FORCE = 0.2;
```

### Key Rules:

1. **Use `p5.Vector`** for all vector math
2. **No magic numbers** - use named constants
3. **Dedicated behavior methods** - each behavior in its own method (e.g., `seek(target)`, `flee(target)`)
4. **Rendering logic** stays in `show()` only
5. **Physics logic** stays in `update()` only
6. **Behavior logic** stays in `applyBehaviors()` or dedicated methods

## 📁 Project Structure (Recommended)

```
project/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── Vehicule.js        # 🔒 Base class - DO NOT MODIFY
│   ├── Car.js             # Subclass for car racing
│   ├── Obstacle.js        # Static/Dynamic obstacles
│   ├── Track.js           # Circuit/Track management
│   ├── globals.js         # Constants and global config
│   ├── sketch.js          # Main p5.js sketch
│   └── utils.js           # Utility functions
└── README.md
```

## 🎨 Style Guidelines

- ✅ Clear, descriptive method names
- ✅ No duplicated logic (DRY principle)
- ✅ Comment complex math and physics calculations
- ✅ Use French or English consistently (not mixed)

## 🏎️ Car Racing Project Specifics

For the car racing simulation:

- **Obstacles**: Static and dynamic obstacles on the track
- **Checkpoints**: Validation points for lap completion
- **Collision Detection**: Using bounding boxes or ray casting
- **AI Drivers**: Neural network or genetic algorithm controlled
- **Track Elements**:
  - Straight sections
  - Curves/Turns (virages)
  - Obstacles
  - Start/Finish line

---

## 📚 References

- [Craig Reynolds - Steering Behaviors](https://www.red3d.com/cwr/steer/)
- [The Nature of Code - Autonomous Agents](https://natureofcode.com/autonomous-agents/)
- [p5.js Reference](https://p5js.org/reference/)
