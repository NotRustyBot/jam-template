import { Container, type Application } from "pixi.js";
import { Random } from "random";
import { Camera } from "./camera";

export const random = new Random();

export let game: Game;

export class Game {
    app: Application;
    worldContainer = new Container();
    camera = new Camera();
    gameTime = 0;

    public get dt(): number {
        return this.app.ticker.deltaMS / 1000;
    }

    constructor(app: Application) {
        this.app = app;
        game = this;

        app.ticker.add(() => {
            this.update();
        });
    }

    init() {
        this.app.stage.addChild(this.worldContainer);
        this.worldContainer.addChild(this.camera.sprite);
    }

    update() {
        this.gameTime += this.dt;
        this.camera.update();
    }
}
