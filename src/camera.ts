import { game } from "./game";
import { Vector, type Vectorlike } from "./vector";

export class Camera {

    position = new Vector();

    constructor() {
    }

    update() {
        game.worldContainer.position.x = -this.position.x + game.app.screen.width / 2;
        game.worldContainer.position.y = -this.position.y + game.app.screen.height / 2;
    }

    screenToWorld(x: number, y: number): Vector {
        return new Vector(x - game.worldContainer.x, y - game.worldContainer.y);
    }

    worldToScreen(vector: Vectorlike): Vector {
        return new Vector(vector.x + game.worldContainer.x, vector.y + game.worldContainer.y);
    }
}
