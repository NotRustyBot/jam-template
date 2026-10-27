import { Container, type Application } from "pixi.js";
import { Random } from "random";
import { Camera } from "./camera";
import { ObjectManager } from "./objectManager";
import { input } from "./input";
import { Timers, type TimerHandle } from "./timers";
import type { Vector } from "./vector";

export const random = new Random();

export let game: Game;
export let objs: ObjectManager;

export class Game {
    app: Application;
    worldContainer = new Container();
    /** Layer names are inferred from these keys. Order is render order. */
    layers = {
        background: new Container(),
        entity: new Container(),
        foreground: new Container(),
    };
    uiContainer = new Container();
    camera = new Camera();
    gameTime = 0;

    /** Skip all gameplay updates. Camera and editor still work. */
    paused = false;
    /** Key that toggles pause. Set to null to handle pause yourself. */
    pauseKey: string | null = "Escape";
    /** Scales the delta time passed to objects. Set to 0 for a slow-motion freeze. */
    timeScale = 1;
    /** Largest delta (in seconds) a single frame can pass to objects. */
    maxDt = 1 / 20;

    readonly timers = new Timers();

    private hiddenPaused = false;
    private readonly onTick = () => this.update();

    public get dt(): number {
        return Math.min(this.app.ticker.deltaMS / 1000, this.maxDt) * this.timeScale;
    }

    /** Pointer position in world space. */
    public get mouse(): Vector {
        return this.camera.screenToWorld(input.mouse.x, input.mouse.y);
    }

    /** Pointer position in screen space. */
    public get mouseScreen(): Vector {
        return input.mouse;
    }

    public get mouseDown(): boolean {
        return input.mouseDown;
    }

    /** Held keys by KeyboardEvent.code; unpressed keys are undefined. */
    public get keys(): Record<string, boolean | undefined> {
        return input.keys;
    }

    constructor(app: Application) {
        this.app = app;
        game = this;
        objs = new ObjectManager();

        app.ticker.add(this.onTick);
    }

    init() {
        this.app.stage.addChild(this.worldContainer);
        for (const layer of Object.values(this.layers)) {
            this.worldContainer.addChild(layer);
        }
        this.app.stage.addChild(this.uiContainer);

        input.bind(this.app.canvas);
        document.addEventListener("visibilitychange", this.onVisibilityChange);
        this.camera.update(0);
    }

    pause() {
        this.paused = true;
        input.clear();
    }

    resume() {
        this.paused = false;
    }

    togglePause() {
        if (this.paused) this.resume();
        else this.pause();
    }

    /** Run once after `seconds` of unpaused game time. */
    after(seconds: number, callback: () => void): TimerHandle {
        return this.timers.after(seconds, callback);
    }

    /** Run repeatedly every `seconds` of unpaused game time. */
    every(seconds: number, callback: () => void): TimerHandle {
        return this.timers.every(seconds, callback);
    }

    update() {
        if (this.pauseKey && input.pressed(this.pauseKey)) {
            this.togglePause();
        }

        if (this.paused) {
            input.endFrame();
            return;
        }

        this.gameTime += this.dt;

        for (const obj of objs.getAll("preupdate")) obj.preupdate();
        for (const obj of objs.getAll("updatable")) obj.update();

        this.timers.update(this.dt);
        this.camera.update(this.dt);

        for (const obj of objs.getAll("drawable")) obj.draw();
        for (const obj of objs.getAll("postprocess")) obj.postprocess();

        input.endFrame();
    }

    destroy() {
        input.unbind();
        document.removeEventListener("visibilitychange", this.onVisibilityChange);
        this.timers.clear();
        this.app.ticker.remove(this.onTick);
    }

    private onVisibilityChange = () => {
        if (document.hidden) {
            input.clear();
            if (!this.paused) {
                this.hiddenPaused = true;
                this.pause();
            }
        } else if (this.hiddenPaused) {
            this.hiddenPaused = false;
            this.resume();
        }
    };
}

/** Every key of `Game.layers`, inferred from the layer object. */
export type LayerName = keyof Game["layers"];
