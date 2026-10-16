import type { GameObject } from "../gameObject";
import type { WorldObject, WorldState } from "../world";

export interface Editor {
    state: EditorState;
    spawn(type: string, x: number, y: number): void;
    select(id: string | null): void;
    move(id: string, x: number, y: number): void;
    setProp(id: string, key: string, value: unknown): void;
    remove(id: string): void;
    duplicate(id: string): void;
    save(): Promise<void>;
    reload(): Promise<void>;
    setLevel(level: string): void;
    refresh(): void;
    setStatus(text: string): void;
}

export class EditorState {
    world: WorldState;
    instances: Map<string, GameObject>;
    selectedId: string | null = null;
    level: string;
    snap = 16;
    showGrid = true;
    visible = true;

    constructor(world: WorldState, instances: Map<string, GameObject>) {
        this.world = world;
        this.instances = instances;
        this.level = world.name || "default";
    }

    get selected(): GameObject | undefined {
        return this.selectedId == null ? undefined : this.instances.get(this.selectedId);
    }

    get selectedEntry(): WorldObject | undefined {
        return this.selectedId == null
            ? undefined
            : this.world.objects.find((o) => o.id === this.selectedId);
    }
}
