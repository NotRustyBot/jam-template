import { Graphics, type FederatedPointerEvent } from "pixi.js";
import { game } from "../game";
import type { Editor } from "./state";

export class Gizmo {
    graphics = new Graphics();

    private dragging = false;
    private dragId: string | null = null;
    private startWorld = { x: 0, y: 0 };
    private startPos = { x: 0, y: 0 };

    constructor(private editor: Editor) {
        game.app.stage.addChild(this.graphics);

        game.app.stage.eventMode = "static";
        game.app.stage.hitArea = game.app.screen;
        game.app.stage.on("pointerdown", this.onDown);
        game.app.stage.on("globalpointermove", this.onMove);
        window.addEventListener("pointerup", this.onUp);

        game.app.ticker.add(() => this.redraw());
    }

    setVisible(visible: boolean) {
        this.graphics.visible = visible;
        game.app.stage.eventMode = visible ? "static" : "auto";
    }

    private onDown = (e: FederatedPointerEvent) => {
        if (!this.editor.state.visible) return;

        const hits = [...this.editor.state.instances.entries()].reverse();
        const hit = hits.find(([, obj]) =>
            obj.container.getBounds().containsPoint(e.global.x, e.global.y)
        );

        if (!hit) {
            this.editor.select(null);
            return;
        }

        const [id, obj] = hit;
        this.editor.select(id);

        const world = game.camera.screenToWorld(e.global.x, e.global.y);
        this.dragging = true;
        this.dragId = id;
        this.startWorld = { x: world.x, y: world.y };
        this.startPos = { x: obj.position.x, y: obj.position.y };
    };

    private onMove = (e: FederatedPointerEvent) => {
        if (!this.dragging || this.dragId == null) return;

        const world = game.camera.screenToWorld(e.global.x, e.global.y);
        let nx = this.startPos.x + (world.x - this.startWorld.x);
        let ny = this.startPos.y + (world.y - this.startWorld.y);

        const snap = this.editor.state.snap;
        if (snap > 0 && !e.shiftKey) {
            nx = Math.round(nx / snap) * snap;
            ny = Math.round(ny / snap) * snap;
        }

        this.editor.move(this.dragId, nx, ny);
    };

    private onUp = () => {
        this.dragging = false;
        this.dragId = null;
    };

    private redraw() {
        if (!this.editor.state.visible) return;

        this.graphics.clear();

        if (this.editor.state.showGrid) this.drawGrid();

        const obj = this.editor.state.selected;
        if (!obj) return;

        const bounds = obj.container.getBounds();
        this.graphics.rect(
            bounds.minX,
            bounds.minY,
            bounds.maxX - bounds.minX,
            bounds.maxY - bounds.minY
        );
        this.graphics.stroke({ width: 2, color: 0x00ffff });

        const center = game.camera.worldToScreen(obj.position);
        this.graphics.moveTo(center.x - 8, center.y);
        this.graphics.lineTo(center.x + 8, center.y);
        this.graphics.moveTo(center.x, center.y - 8);
        this.graphics.lineTo(center.x, center.y + 8);
        this.graphics.stroke({ width: 1, color: 0xff00ff });
    }

    private drawGrid() {
        const snap = Math.max(this.editor.state.snap, 4);
        const width = game.app.screen.width;
        const height = game.app.screen.height;
        const offsetX = ((game.worldContainer.x % snap) + snap) % snap;
        const offsetY = ((game.worldContainer.y % snap) + snap) % snap;

        for (let x = offsetX; x < width; x += snap) {
            this.graphics.moveTo(x, 0);
            this.graphics.lineTo(x, height);
        }
        for (let y = offsetY; y < height; y += snap) {
            this.graphics.moveTo(0, y);
            this.graphics.lineTo(width, y);
        }
        this.graphics.stroke({ width: 1, color: 0x1a1a1a });
    }
}
