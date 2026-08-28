import { Sprite, Texture } from "pixi.js";
import { game } from "./game";
import { Vector } from "./vector";

export class Camera {

    position = new Vector();
    sprite: Sprite;

    constructor() {
        this.sprite = new Sprite(Texture.WHITE);
        this.sprite.tint = 0x000000;
    }

    update() {
        this.sprite.width = game.app.screen.width;
        this.sprite.height = game.app.screen.height;

        game.worldContainer.position.x = -this.position.x + game.app.screen.width / 2;
        game.worldContainer.position.y = -this.position.y + game.app.screen.height / 2;

        this.sprite.x = -game.worldContainer.x;
        this.sprite.y = -game.worldContainer.y;
    }
}
