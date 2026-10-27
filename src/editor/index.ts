import "./editor.css";
import { clearWorld, spawnWorld, type WorldState } from "../world";
import { createObject, GameObject } from "../gameObject";
import { EditorState, type Editor } from "./state";
import { createOverlay, type Overlay } from "./overlay";
import { Gizmo } from "./gizmo";
import { loadWorldFromServer, saveWorld } from "./persistence";
import { game } from "../game";

class LevelEditor implements Editor {
    state: EditorState;
    private overlay: Overlay;
    private gizmo: Gizmo;
    private readonly gamePauseKey: string | null;

    constructor(world: WorldState, instances: Map<string, GameObject>) {
        this.state = new EditorState(world, instances);
        this.overlay = createOverlay(this);
        this.gizmo = new Gizmo(this);

        // Escape is the editor's deselect key; don't also toggle the game pause.
        this.gamePauseKey = game.pauseKey;
        game.pauseKey = null;

        this.bindKeys();
    }

    spawn(type: string, x: number, y: number) {
        const obj = createObject(type, { x, y });
        const id = obj.id;
        this.state.world.objects.push({ id, type, props: obj.serialize() });
        this.state.instances.set(id, obj);
        this.select(id);
    }

    select(id: string | null) {
        this.state.selectedId = id;
        this.overlay.update();
    }

    move(id: string, x: number, y: number) {
        const obj = this.state.instances.get(id);
        const entry = this.state.world.objects.find((o) => o.id === id);
        if (!obj || !entry) return;
        obj.position.set(x, y);
        obj.draw();
        entry.props.x = x;
        entry.props.y = y;
    }

    setProp(id: string, key: string, value: unknown) {
        const entry = this.state.world.objects.find((o) => o.id === id);
        const obj = this.state.instances.get(id);
        if (!entry || !obj) return;

        entry.props[key] = value;
        (obj as unknown as Record<string, unknown>)[key] = value;

        // Classes with a custom refresh() update in place; otherwise rebuild.
        if (obj.refresh === GameObject.prototype.refresh) this.rebuild(id);
        else obj.refresh();
    }

    remove(id: string) {
        this.state.instances.get(id)?.destroy();
        this.state.instances.delete(id);
        this.state.world.objects = this.state.world.objects.filter((o) => o.id !== id);
        if (this.state.selectedId === id) this.state.selectedId = null;
        this.overlay.update();
    }

    duplicate(id: string) {
        const entry = this.state.world.objects.find((o) => o.id === id);
        if (!entry) return;
        const offset = this.state.snap || 1;
        const props = {
            ...entry.props,
            x: (entry.props.x ?? 0) + offset,
            y: (entry.props.y ?? 0) + offset,
        };
        const obj = createObject(entry.type, props);
        const newId = obj.id;
        this.state.world.objects.push({ id: newId, type: entry.type, props: obj.serialize() });
        this.state.instances.set(newId, obj);
        this.select(newId);
    }

    async save() {
        for (const entry of this.state.world.objects) {
            const obj = this.state.instances.get(entry.id);
            if (obj) entry.props = obj.serialize();
        }
        const count = await saveWorld(this.state.level, this.state.world);
        this.setStatus(`saved ${count} objects`);
    }

    async reload() {
        const fresh = await loadWorldFromServer(this.state.level);
        clearWorld(this.state.instances);
        fresh.name = this.state.level;
        this.state.world = fresh;
        const spawned = spawnWorld(this.state.world);
        for (const [id, obj] of spawned) this.state.instances.set(id, obj);
        this.state.selectedId = null;
        this.overlay.update();
        this.setStatus("reloaded");
    }

    setLevel(level: string) {
        this.state.level = level || "default";
        this.state.world.name = this.state.level;
    }

    refresh() {
        this.overlay.update();
    }

    setStatus(text: string) {
        this.overlay.setStatus(text);
        console.log(`[editor] ${text}`);
    }

    private rebuild(id: string) {
        const entry = this.state.world.objects.find((o) => o.id === id);
        if (!entry) return;
        this.state.instances.get(id)?.destroy();
        const obj = createObject(entry.type, entry.props);
        obj.id = id;
        this.state.instances.set(id, obj);
    }

    private toggle() {
        this.state.visible = !this.state.visible;
        this.overlay.element.style.display = this.state.visible ? "flex" : "none";
        this.gizmo.setVisible(this.state.visible);
        game.pauseKey = this.state.visible ? null : this.gamePauseKey;
    }

    private bindKeys() {
        window.addEventListener("keydown", (e) => {
            const target = e.target as HTMLElement | null;
            if (
                target &&
                (target.tagName === "INPUT" ||
                    target.tagName === "SELECT" ||
                    target.tagName === "TEXTAREA")
            ) {
                return;
            }

            if (e.code === "Backquote") {
                this.toggle();
                e.preventDefault();
                return;
            }

            if (e.code === "Escape") {
                this.select(null);
                return;
            }

            const selected = this.state.selectedId;
            if (!selected) return;

            if (e.code === "Delete" || e.code === "Backspace") {
                this.remove(selected);
                e.preventDefault();
                return;
            }

            if (e.code === "KeyD" && (e.ctrlKey || e.metaKey)) {
                this.duplicate(selected);
                e.preventDefault();
                return;
            }

            const obj = this.state.instances.get(selected);
            if (!obj) return;

            const step = e.shiftKey ? 1 : this.state.snap || 1;
            const moves: Record<string, [number, number]> = {
                ArrowLeft: [-step, 0],
                ArrowRight: [step, 0],
                ArrowUp: [0, -step],
                ArrowDown: [0, step],
            };
            const move = moves[e.code];
            if (move) {
                this.move(selected, obj.position.x + move[0], obj.position.y + move[1]);
                e.preventDefault();
            }
        });
    }
}

export function startEditor(world: WorldState, instances: Map<string, GameObject>): Editor {
    return new LevelEditor(world, instances);
}
