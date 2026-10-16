import { Container, type Application } from "pixi.js";
import { Random } from "random";
import { Camera } from "./camera";
import { ObjectManager } from "./objectManager";

export const random = new Random();

export let game: Game;
export let objs: ObjectManager;

export class Game {
    app: Application;
    worldContainer = new Container();
    layers = {
        background: new Container(),
        entity: new Container(),
        foreground: new Container(),
    };
    uiContainer = new Container();
    camera = new Camera();
    gameTime = 0;

    public get dt(): number {
        return this.app.ticker.deltaMS / 1000;
    }

    constructor(app: Application) {
        this.app = app;
        game = this;
        objs = new ObjectManager();

        app.ticker.add(() => {
            this.update();
        });
    }

    init() {
        this.app.stage.addChild(this.worldContainer);
        this.worldContainer.addChild(this.layers.background);
        this.worldContainer.addChild(this.layers.entity);
        this.worldContainer.addChild(this.layers.foreground);
        this.app.stage.addChild(this.uiContainer);
    }

    update() {
        this.gameTime += this.dt;
        for (const obj of objs.getAll("preupdate")) obj.preupdate();
        for (const obj of objs.getAll("updatable")) obj.update();
        for (const obj of objs.getAll("drawable")) obj.draw();
        for (const obj of objs.getAll("postprocess")) obj.postprocess();
        this.camera.update();
    }
}
